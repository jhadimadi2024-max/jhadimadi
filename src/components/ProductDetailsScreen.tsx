import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  ShoppingCart, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Minus, 
  Plus, 
  Check, 
  Youtube, 
  Package, 
  Sparkles, 
  X, 
  User, 
  Loader2, 
  ExternalLink, 
  Tag, 
  Banknote, 
  CreditCard, 
  Truck, 
  Copy, 
  MessageSquare, 
  AlertCircle,
  ShoppingBag,
  Zap,
  Star,
  Image as ImageIcon,
  Clock,
  ThumbsUp,
  HelpCircle,
  Award,
  Send,
  Calendar,
  Store
} from 'lucide-react';
import { Language } from '../types';
import { databaseService } from '../services/databaseService';
import { useData } from '../context/DataContext';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';
import { 
  sanitizeName, 
  sanitizePhone, 
  sanitizeAddress, 
  isValidBangladeshPhone 
} from '../utils/securitySanitizer';

export interface ProductDetailItem {
  id: string;
  code?: string;
  sku?: string;
  name: string;
  nameBn?: string;
  nameEn?: string;
  title_bn?: string;
  title_en?: string;
  image?: string;
  category?: string;
  categoryLabelBn?: string;
  pricePerUnit: number;
  discount_price?: number;
  discountPrice?: number;
  originalPrice?: number;
  unit: string;
  unit_pack?: string;
  stockQuantity: number;
  stock_quantity?: number;
  minOrderQuantity?: number;
  originLocation: string;
  origin?: string;
  production_origin?: string;
  qualityGrade?: string;
  quality_standard?: string;
  seller_info?: string;
  youtubeUrl?: string;
  videoUrl?: string;
  qrCodeUrl?: string;
  images: string[];
  description: string;
  badges?: string[];
  badge?: string;
  key_highlights?: string[];
  benefits?: string[];
  features?: string[];
  how_it_is_produced?: string;
  productionMethod?: string;
  materials_and_ingredients?: string;
  materials?: string;
  usage_and_storage?: string;
  usageInstructions?: string;
  expiryDate?: string; // OPTIONAL: only display if explicitly provided by seller/listing
  seller?: {
    name: string;
    avatar?: string;
    phoneHidden?: string;
    realPhone?: string;
    isNidVerified?: boolean;
    rating?: number;
    reviewsCount?: number;
    location?: string;
    uniqueId?: string;
    isRealVerifiedSeller?: boolean;
  };
}

interface ProductDetailsScreenProps {
  product: ProductDetailItem;
  onBack: () => void;
  onAddToCart?: (product: ProductDetailItem, quantity: number) => void;
  onBuyNow?: (product: ProductDetailItem, quantity: number) => void;
  onOpenCart?: () => void;
  onOpenChat?: (sellerName: string) => void;
  cartCount?: number;
  lang?: Language;
  currentUser?: any;
}

// Bangladeshi Courier Options with Estimated Delivery Times
const BANGLADESH_COURIERS = [
  { id: 'sundarban', name: 'সুন্দরবন কুরিয়ার সার্ভিস (Sundarban Courier)', estTime: '১-৩ কার্যদিবস', popular: true },
  { id: 'sa_paribahan', name: 'এস এ পরিবহন (SA Paribahan)', estTime: '১-২ কার্যদিবস', popular: true },
  { id: 'steadfast', name: 'স্টিডফাস্ট কুরিয়ার (Steadfast Courier)', estTime: '২-৩ কার্যদিবস', popular: true },
  { id: 'pathao', name: 'পাঠাও কুরিয়ার (Pathao Courier)', estTime: '২-৪ কার্যদিবস' },
  { id: 'redx', name: 'রেডএক্স কুরিয়ার (RedX Logistics)', estTime: '২-৪ কার্যদিবস' },
  { id: 'home_delivery', name: 'হোম ডেলিভারি / লোকাল কুরিয়ার (Home Delivery)', estTime: '২৪-৪৮ ঘণ্টার মধ্যে', popular: true },
  { id: 'others', name: 'অন্যান্য (Others - নিজে লিখুন)', estTime: 'অ্যাডমিন নির্ধারিত' }
];

/**
 * Dynamic Video Placeholder Logic:
 * Converts a genuine YouTube URL format into an embed URL.
 * Returns null if the URL is empty, invalid, or a placeholder/fake link.
 * Strictly avoids rendering default or fake embeddings (e.g. Rick Astley).
 */
export const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }
  const clean = url.trim();

  // Guard against placeholder / dummy strings
  if (
    clean.includes('dQw4w9WgXcQ') || 
    clean.includes('example.com') ||
    clean.toLowerCase().includes('dummy') ||
    clean.toLowerCase().includes('placeholder')
  ) {
    return null;
  }

  if (clean.includes('youtube.com/embed/')) {
    return clean;
  }

  const watchMatch = clean.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return `https://www.youtube.com/embed/${clean}`;
  }

  return null;
};

interface CustomerReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

const formatReviewDateBn = (dateStr?: string): string => {
  if (!dateStr) return 'সম্প্রতি';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'আজকে';
    if (diffDays === 1) return 'গতকাল';
    if (diffDays < 7) return `${diffDays.toLocaleString('bn-BD')} দিন আগে`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7).toLocaleString('bn-BD')} সপ্তাহ আগে`;
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'সম্প্রতি';
  }
};

export const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({
  product,
  onBack,
  onAddToCart,
  onBuyNow,
  onOpenCart,
  cartCount = 0,
  currentUser
}) => {
  const { addOrder } = useData();
  const buyNowSectionRef = useRef<HTMLDivElement | null>(null);

  // Images state - Strictly display only genuine product media directly from Supabase
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const images = useMemo(() => {
    const candidateList: string[] = [];
    const mainPhoto = (product as any).products_photos || (product as any).image_url || product.image;
    if (mainPhoto && typeof mainPhoto === 'string' && mainPhoto.trim().length > 0) {
      candidateList.push(getProductPublicUrl(mainPhoto.trim()));
    }
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (typeof img === 'string' && img.trim().length > 0) {
          const resolved = getProductPublicUrl(img.trim());
          if (!candidateList.includes(resolved)) {
            candidateList.push(resolved);
          }
        }
      }
    }

    const filtered = candidateList.filter((img) => {
      const lower = img.toLowerCase();
      return (
        !lower.includes('demo-image') &&
        !lower.includes('demo_image') &&
        !lower.includes('placeholder') &&
        !lower.includes('dummy') &&
        !img.includes('photo-1586201375761') &&
        !img.includes('photo-1596040033229') &&
        !img.includes('photo-1546069901')
      );
    });
    if (filtered.length > 0) return filtered;
    if (candidateList.length > 0 && candidateList[0] !== NO_IMAGE_AVAILABLE_ICON) return candidateList;
    return [NO_IMAGE_AVAILABLE_ICON];
  }, [product.images, product.image, (product as any).products_photos]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.id, images.length]);

  // Dynamic Video Link detection: Show ONLY if a genuine video URL is provided
  const validVideoEmbedUrl = useMemo(() => {
    const rawUrl = product.youtubeUrl || product.videoUrl;
    return getYouTubeEmbedUrl(rawUrl);
  }, [product.youtubeUrl, product.videoUrl]);

  // Feedback notifications
  const [copiedToast, setCopiedToast] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  // Quantity selection
  const [quantity, setQuantity] = useState(1);

  // Auto-filled Product SKU / Code
  const autoProductCode = useMemo(() => {
    return product.sku || product.code || `JDM-${product.id ? product.id.slice(0, 6).toUpperCase() : '001'}`;
  }, [product.sku, product.code, product.id]);

  // Customer Information inputs
  const [customerName, setCustomerName] = useState(currentUser?.name || currentUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(currentUser?.address || '');

  // Shipping Courier Method
  const [selectedCourier, setSelectedCourier] = useState('সুন্দরবন কুরিয়ার সার্ভিস (Sundarban Courier)');
  const [customCourierName, setCustomCourierName] = useState('');

  // Payment Method: 'cod' (Cash on Delivery) or 'digital' (bKash/Nagad/Card)
  const [paymentType, setPaymentType] = useState<'cod' | 'digital'>('cod');
  const [digitalGateway, setDigitalGateway] = useState<'bkash' | 'nagad' | 'card'>('bkash');

  // Submitting / Post-submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation / Success Receipt Modal State
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    productCode: string;
    productName: string;
    quantity: number;
    totalAmount: number;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    courier: string;
    paymentMethod: string;
    waUrl: string;
  } | null>(null);

  // Quick Checkout Modal state
  const [isQuickCheckoutOpen, setIsQuickCheckoutOpen] = useState(false);

  // Customer Reviews state (Purely dynamic Supabase database data)
  const [reviewsList, setReviewsList] = useState<CustomerReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [reviewName, setReviewName] = useState(currentUser?.name || currentUser?.fullName || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Fetch real reviews submitted by verified buyers from Supabase table (product_reviews)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingReviews(true);

    const loadReviews = async () => {
      try {
        const prodId = String(product.id || '');
        const prodCode = String(product.code || product.sku || '');
        const data = await databaseService.getProductReviews(prodId, prodCode);
        if (isMounted) {
          const mapped: CustomerReview[] = (data || []).map((r: any) => ({
            id: String(r.id),
            name: r.user_name || 'সম্মানিত ক্রেতা',
            location: r.user_location || 'বাংলাদেশ',
            rating: Number(r.rating) || 5,
            date: formatReviewDateBn(r.created_at),
            comment: r.comment || '',
            verifiedPurchase: r.is_verified_buyer !== false
          }));
          setReviewsList(mapped);
        }
      } catch (err) {
        console.warn('Could not load reviews:', err);
        if (isMounted) setReviewsList([]);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };

    loadReviews();
    return () => { isMounted = false; };
  }, [product.id, product.code, product.sku]);

  // Dynamic Price & Honest Discount Calculation:
  // Display discount badges ONLY if the product in the Supabase database actually has a valid original_price and discounted_price.
  // If no discount is entered during product posting, do not render any discount badge at all.
  const rawPrice = Number(product.pricePerUnit ?? (product as any).price) || 0;
  const rawDiscount = (product.discount_price !== undefined && product.discount_price !== null && Number(product.discount_price) > 0)
    ? Number(product.discount_price)
    : ((product.discountPrice !== undefined && product.discountPrice !== null && Number(product.discountPrice) > 0) ? Number(product.discountPrice) : undefined);
  const rawOriginal = ((product as any).original_price !== undefined && (product as any).original_price !== null && Number((product as any).original_price) > 0)
    ? Number((product as any).original_price)
    : (product.originalPrice !== undefined && product.originalPrice !== null && Number(product.originalPrice) > 0 ? Number(product.originalPrice) : undefined);

  // A genuine discount exists ONLY when BOTH valid original_price and discounted_price exist in DB and original > discount
  const hasGenuineDiscount = Boolean(
    rawOriginal !== undefined && 
    rawDiscount !== undefined && 
    rawOriginal > rawDiscount
  );
  const unitPrice = hasGenuineDiscount ? rawDiscount! : rawPrice;
  const originalPrice = hasGenuineDiscount ? rawOriginal! : 0;
  const discountPercent = (hasGenuineDiscount && rawOriginal && rawDiscount) 
    ? Math.round(((rawOriginal - rawDiscount) / rawOriginal) * 100) 
    : 0;
  const dynamicTotalPrice = unitPrice * quantity;

  // Real Dynamic Review Calculations
  const totalReviewsCount = reviewsList.length;
  const avgRatingNum = totalReviewsCount > 0
    ? Number((reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviewsCount).toFixed(1))
    : 0;
  const avgRatingDisplay = totalReviewsCount > 0 ? avgRatingNum.toFixed(1) : '০.০';

  // Dynamic Star Percentages
  const fiveStarsCount = reviewsList.filter(r => Math.round(Number(r.rating)) === 5).length;
  const fourStarsCount = reviewsList.filter(r => Math.round(Number(r.rating)) === 4).length;
  const threeStarsCount = reviewsList.filter(r => Math.round(Number(r.rating)) === 3).length;
  const twoStarsCount = reviewsList.filter(r => Math.round(Number(r.rating)) === 2).length;
  const oneStarsCount = reviewsList.filter(r => Math.round(Number(r.rating)) === 1).length;

  const pct5 = totalReviewsCount > 0 ? Math.round((fiveStarsCount / totalReviewsCount) * 100) : 0;
  const pct4 = totalReviewsCount > 0 ? Math.round((fourStarsCount / totalReviewsCount) * 100) : 0;
  const pct3 = totalReviewsCount > 0 ? Math.round((threeStarsCount / totalReviewsCount) * 100) : 0;
  const pct2 = totalReviewsCount > 0 ? Math.round((twoStarsCount / totalReviewsCount) * 100) : 0;
  const pct1 = totalReviewsCount > 0 ? Math.round((oneStarsCount / totalReviewsCount) * 100) : 0;

  // Badges list (Dynamic Tags)
  const productBadges = useMemo(() => {
    if (Array.isArray(product.badges) && product.badges.length > 0) {
      return product.badges.filter(b => typeof b === 'string' && b.trim().length > 0);
    }
    if (product.badge && typeof product.badge === 'string' && product.badge.trim().length > 0) {
      return [product.badge.trim()];
    }
    return [];
  }, [product.badges, product.badge]);

  // Key Highlights list (Strictly from dynamic database or empty)
  const highlightsList = useMemo(() => {
    if (Array.isArray(product.key_highlights) && product.key_highlights.length > 0) {
      return product.key_highlights.filter(h => typeof h === 'string' && h.trim().length > 0);
    }
    if (Array.isArray(product.features) && product.features.length > 0) {
      return product.features.filter(h => typeof h === 'string' && h.trim().length > 0);
    }
    if (Array.isArray(product.benefits) && product.benefits.length > 0) {
      return product.benefits.filter(h => typeof h === 'string' && h.trim().length > 0);
    }
    return [];
  }, [product.key_highlights, product.features, product.benefits]);

  // Quantity controllers
  const handleQuantityIncrement = () => {
    setQuantity(prev => (prev < (product.stockQuantity || 99) ? prev + 1 : prev));
  };

  const handleQuantityDecrement = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  // Add to Cart handler
  const handleAddToCartAction = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  // Open Quick Checkout Modal
  const handleOpenQuickCheckout = () => {
    setFormError('');
    setIsQuickCheckoutOpen(true);
  };

  // Smooth scroll to Customer Reviews section
  const handleScrollToReviews = () => {
    const el = document.getElementById('section-product-reviews');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Order Confirmation Submission Handler
  const handleConfirmOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = sanitizeName(customerName);
    const cleanPhone = sanitizePhone(customerPhone);
    const cleanAddress = sanitizeAddress(customerAddress);
    const cleanCustomCourier = sanitizeName(customCourierName);

    if (!cleanName) {
      setFormError('অনুগ্রহ করে আপনার সঠিক নাম লিখুন।');
      return;
    }

    if (!cleanPhone || !isValidBangladeshPhone(cleanPhone)) {
      setFormError('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 018XXXXXXXX বা 017XXXXXXXX)।');
      return;
    }

    if (!cleanAddress || cleanAddress.length < 5) {
      setFormError('অনুগ্রহ করে আপনার বিস্তারিত ডেলিভারি ঠিকানা লিখুন (বাড়ি নং, রাস্তা/গ্রাম, থানা, জেলা)।');
      return;
    }

    if (selectedCourier.includes('অন্যান্য') && !cleanCustomCourier) {
      setFormError('অনুগ্রহ করে পছন্দের কুরিয়ারের নাম লিখুন অথবা তালিকা থেকে একটি নির্বাচন করুন।');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalOrderId = `JDM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const finalCourier = selectedCourier.includes('অন্যান্য')
        ? (cleanCustomCourier || 'অন্যান্য কুরিয়ার (অ্যাডমিন নির্ধারিত)')
        : selectedCourier;

      const paymentTitle = paymentType === 'cod' 
        ? 'ক্যাশ অন ডেলিভারি (Cash on Delivery)'
        : (digitalGateway === 'bkash' ? 'বিকাশ (bKash) পেমেন্ট' : (digitalGateway === 'nagad' ? 'নগদ (Nagad) পেমেন্ট' : 'কার্ড (Card) পেমেন্ট'));

      // 1. WhatsApp Notification Message Formatting
      const waOrderText = 
        `🛍️ *ঝাদিমাদি ডটকম (JHADIMADI.COM) - নতুন পণ্য অর্ডার*\n` +
        `==========================\n` +
        `🔖 *অর্ডার আইডি:* #${finalOrderId}\n` +
        `🏷️ *প্রোডাক্ট কোড:* ${autoProductCode}\n` +
        `📦 *পণ্য:* ${product.nameBn || product.name}\n` +
        `🔢 *পরিমাণ:* ${quantity} টি (${product.unit})\n` +
        `💵 *একক মূল্য:* ৳${unitPrice}\n` +
        `💰 *মোট প্রদেয় মূল্য:* ৳${dynamicTotalPrice}\n` +
        `🚚 *কুরিয়ার সার্ভিস:* ${finalCourier}\n` +
        `💳 *পেমেন্ট পদ্ধতি:* ${paymentTitle}\n` +
        `--------------------------\n` +
        `👤 *গ্রাহকের বিবরণ:*\n` +
        `• নাম: ${cleanName}\n` +
        `• মোবাইল: ${cleanPhone}\n` +
        `• ডেলিভারি ঠিকানা: ${cleanAddress}\n` +
        `• সময়: ${new Date().toLocaleString('bn-BD')}\n` +
        `==========================\n` +
        `সার্ভারে সংরক্ষিত হয়েছে। অনুগ্রহ করে অর্ডারটি দ্রুত প্রসেস করুন।`;

      const waAdminUrl = `https://wa.me/8801870592699?text=${encodeURIComponent(waOrderText)}`;

      // 2. DataContext state update
      addOrder({
        id: finalOrderId,
        customerName: cleanName,
        customerPhone: cleanPhone,
        deliveryAddress: cleanAddress,
        totalAmount: dynamicTotalPrice,
        paymentMethod: paymentType === 'cod' ? 'COD' : (digitalGateway === 'bkash' ? 'bKash' : (digitalGateway === 'nagad' ? 'Nagad' : 'bKash')),
        status: 'Pending',
        notes: `Product Code: ${autoProductCode} | Courier: ${finalCourier} | Payment: ${paymentTitle} | Qty: ${quantity}`,
        items: [{
          productId: product.id,
          nameBn: product.nameBn || product.name,
          quantity: quantity,
          price: unitPrice,
          image: images[0] || product.image || ''
        }]
      });

      // 3. Supabase Database Synchronization
      databaseService.submitOrderToDatabase({
        id: finalOrderId,
        customerName: cleanName,
        customerPhone: cleanPhone,
        deliveryAddress: cleanAddress,
        status: 'Pending',
        date: new Date().toISOString(),
        items: [{
          productId: product.id,
          nameBn: product.nameBn || product.name,
          quantity: quantity,
          price: unitPrice,
          image: images[0] || product.image || ''
        }],
        totalAmount: dynamicTotalPrice,
        paymentMethod: paymentType === 'cod' ? 'COD' : (digitalGateway === 'bkash' ? 'bKash' : (digitalGateway === 'nagad' ? 'Nagad' : 'bKash')),
        notes: `Product Code: ${autoProductCode} | Courier: ${finalCourier} | Payment: ${paymentTitle}`
      }).catch(err => console.warn('[Database] Sync notice:', err));

      // 4. Server API Dispatch
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: finalOrderId,
          productCode: autoProductCode,
          courierService: finalCourier,
          quantity: quantity,
          customerName: cleanName,
          customerPhone: cleanPhone,
          deliveryAddress: cleanAddress,
          district: 'খাগড়াছড়ি / পার্বত্য চট্টগ্রাম',
          product: {
            id: product.id,
            code: autoProductCode,
            name: product.nameBn || product.name,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: dynamicTotalPrice,
            formattedQuantity: `${quantity} ${product.unit}`
          },
          totalAmount: dynamicTotalPrice,
          paymentMethod: paymentTitle,
          notes: `Courier: ${finalCourier}`
        })
      }).catch(err => console.warn('[Server Orders API] Dispatch notice:', err));

      // 5. Present Confirmed Order Receipt and close checkout modal
      setIsQuickCheckoutOpen(false);
      setConfirmedOrder({
        orderId: finalOrderId,
        productCode: autoProductCode,
        productName: product.nameBn || product.name,
        quantity: quantity,
        totalAmount: dynamicTotalPrice,
        customerName: cleanName,
        customerPhone: cleanPhone,
        customerAddress: cleanAddress,
        courier: finalCourier,
        paymentMethod: paymentTitle,
        waUrl: waAdminUrl
      });

    } catch (err: any) {
      console.error('Order submission error:', err);
      setFormError('অর্ডার জমা দিতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit an authentic customer review directly to Supabase
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || isSubmittingReview) return;

    setIsSubmittingReview(true);
    setReviewSubmitError('');
    setReviewSubmitSuccess(false);

    try {
      const cleanComment = reviewComment.trim();
      const cleanName = reviewName.trim() || (currentUser?.name || currentUser?.fullName || 'সম্মানিত ক্রেতা');
      const userId = currentUser?.id || (currentUser as any)?.uid || undefined;
      const userPhone = currentUser?.phone || (currentUser as any)?.phoneNumber || undefined;
      const userLoc = (currentUser as any)?.address || (currentUser as any)?.upazila || (currentUser as any)?.district || 'বাংলাদেশ';

      const res = await databaseService.submitProductReview({
        product_id: String(product.id || autoProductCode),
        user_id: userId,
        user_name: cleanName,
        user_phone: userPhone,
        user_location: userLoc,
        rating: reviewRating,
        comment: cleanComment,
        is_verified_buyer: !!currentUser
      });

      if (res.success && res.review) {
        const newRev: CustomerReview = {
          id: res.review.id,
          name: res.review.user_name,
          location: res.review.user_location || 'বাংলাদেশ',
          rating: res.review.rating,
          date: 'আজকে',
          comment: res.review.comment,
          verifiedPurchase: res.review.is_verified_buyer !== false
        };

        setReviewsList(prev => [newRev, ...prev]);
        setReviewComment('');
        setReviewSubmitSuccess(true);
        setTimeout(() => {
          setIsWriteReviewOpen(false);
          setReviewSubmitSuccess(false);
        }, 1500);
      } else {
        setReviewSubmitError(res.error || 'রিভিউ জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Review submit error:', err);
      setReviewSubmitError('রিভিউ জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="w-full bg-[#faf9f6] min-h-screen font-sans text-slate-800 relative select-text" id="product-details-screen">
      
      {/* 1. শীর্ষ স্টিকি হেডার (Amazon / Daraz Standard Navigation Bar) */}
      <header 
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)' }}
      >
        <button 
          onClick={onBack}
          type="button"
          className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 active:scale-95 transition-all text-xs sm:text-sm font-bold py-1.5 px-3 rounded-xl hover:bg-slate-100 cursor-pointer"
          title="ফিরে যান"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>ফিরে যান</span>
        </button>

        <div className="text-center px-2 flex-1 max-w-[280px] sm:max-w-md truncate">
          <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
            {product.nameBn || product.name}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block">
            {product.categoryLabelBn || 'জৈব ও পাহাড়ি খাঁটি পণ্য'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              setCopiedToast(true);
              setTimeout(() => setCopiedToast(false), 2000);
            }}
            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition active:scale-90"
            title="পণ্য লিংক কপি করুন"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {onOpenCart && (
            <button 
              type="button"
              onClick={onOpenCart}
              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition relative active:scale-90"
              title="শপিং কার্ট দেখুন"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Copy Toast Alert */}
      {copiedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>পণ্য লিংক কপি করা হয়েছে!</span>
        </div>
      )}

      {/* Cart Toast Alert */}
      {addedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          <span>কার্টে সফলভাবে যোগ করা হয়েছে!</span>
        </div>
      )}

      {/* 2. মূল লেআউট কনটেইনার (Amazon & Daraz Standard Architecture) */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8 pb-28 sm:pb-16">
        
        {/* =========================================================================
            A. TOP SECTION (Above the fold): 2-Column Responsive Grid
            Left: Image Gallery + Highlights (+ Video if available)
            Right: Title, SKU, Rating, Price, and Integrated Buy Now Direct Section
            ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ----------------- LEFT COLUMN (lg:col-span-7) ----------------- */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* ১. প্রোডাক্ট ইমেজ গ্যালারি (Product Image Gallery / Viewer) */}
            <div className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-200 shadow-2xs space-y-3">
              <div className="relative w-full aspect-square max-h-[460px] bg-slate-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center group">
                {images.length > 0 || product.image ? (
                  <img 
                    src={getProductPublicUrl(images[selectedImageIndex] || images[0] || product.image)} 
                    alt={product.nameBn || product.name} 
                    className="w-full h-full object-contain sm:object-cover transition-transform duration-300 group-hover:scale-102"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = NO_IMAGE_AVAILABLE_ICON;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                    <ImageIcon className="w-12 h-12 stroke-[1.5] text-gray-300 mb-1" />
                    <span className="text-xs text-gray-400 font-medium">কোনো ছবি সংযুক্ত নেই</span>
                  </div>
                )}

                {/* স্ট্যাটাস ও উৎস ব্যাজসমূহ (Badges - Dynamic from Supabase DB only) */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {Boolean(product.origin || product.originLocation || (product as any).productionOrigin) && (
                    <span className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      {product.origin || product.originLocation || (product as any).productionOrigin}
                    </span>
                  )}

                  {productBadges.slice(0, 2).map((b, idx) => (
                    <span key={idx} className="bg-[#16a34a] text-white text-[9.5px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      {b}
                    </span>
                  ))}
                  {productBadges.length === 0 && Boolean(product.quality_standard || product.qualityGrade) && (
                    <span className="bg-[#16a34a] text-white text-[9.5px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      {product.quality_standard || product.qualityGrade}
                    </span>
                  )}
                </div>

                {/* ডায়নামিক ডিসকাউন্ট ব্যাজ (Only when genuine discount exists) */}
                {hasGenuineDiscount && discountPercent > 0 && (
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                    {discountPercent}% ছাড়
                  </span>
                )}

                {/* প্রোডাক্ট কোড ওয়াটারমার্ক ব্যাজ */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-mono font-black px-2.5 py-1 rounded-lg border border-gray-200 shadow-xs flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  <span>{autoProductCode}</span>
                </div>
              </div>

              {/* থাম্বনেইল গ্যালারি (Multiple Genuine Images) */}
              {images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-slate-50 ${
                        selectedImageIndex === idx 
                          ? 'border-emerald-600 ring-2 ring-emerald-600/30' 
                          : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ২. পণ্যের বিশেষ আকর্ষণ ও উপকারিতা (Key Highlights / Features) */}
            {highlightsList.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>পণ্যের বিশেষ আকর্ষণ ও উপকারিতা (Key Highlights)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {highlightsList.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-gray-100">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <p className="text-xs font-medium text-slate-700 leading-relaxed">
                        {highlight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ৩. ডায়নামিক ভিডিও প্লেয়ার (Dynamic Video Section)
                Requirement: Show ONLY if a valid video URL exists in database; 
                completely hidden without blank layout glitches if not provided. */}
            {validVideoEmbedUrl && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                    <Youtube className="w-5 h-5 text-red-600" />
                    <span>পণ্য ভিডিও রিভিউ ও প্রদর্শনী</span>
                  </div>
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                    ভিডিও প্লেয়ার
                  </span>
                </div>

                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xs border border-gray-200">
                  <iframe
                    src={validVideoEmbedUrl}
                    title={`Video for ${product.nameBn || product.name}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

          </div>

          {/* ----------------- RIGHT COLUMN (lg:col-span-5) ----------------- */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* ১. প্রোডাক্ট টাইটেল, SKU, রেটিং ও মূল্য কার্ড */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
              
              {/* ক্যাটাগরি ও কোড ট্যাগ */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                  {product.categoryLabelBn || 'জৈব পাহাড়ি পণ্য'}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    SKU: {autoProductCode}
                  </span>
                </div>
              </div>

              {/* ডাইনামিক ব্যাজসমূহ (Badges) */}
              {productBadges.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {productBadges.map((b, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {b}
                    </span>
                  ))}
                </div>
              )}

              {/* পণ্যের শিরোনাম */}
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {product.title_bn || product.nameBn || product.name}
                </h1>
                {(product.title_en || product.nameEn) && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {product.title_en || product.nameEn}
                  </p>
                )}
              </div>

              {/* রেটিং ও রিভিউ সারাংশ (Dynamic Star Summary) */}
              <div className="flex items-center justify-between border-y border-gray-100 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-4 h-4 ${s <= Math.round(avgRatingNum) && totalReviewsCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  {totalReviewsCount > 0 ? (
                    <>
                      <span className="font-black text-slate-800 text-xs">{avgRatingDisplay}</span>
                      <button 
                        type="button"
                        onClick={handleScrollToReviews}
                        className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
                      >
                        ({totalReviewsCount} টি ভেরিফাইড রিভিউ)
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleScrollToReviews}
                      className="text-xs text-slate-500 hover:text-emerald-700 hover:underline font-semibold cursor-pointer"
                    >
                      (কোনো রিভিউ নেই • প্রথম রিভিউ দিন)
                    </button>
                  )}
                </div>

                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  স্টকে আছে
                </span>
              </div>

              {/* ক্লিয়ার প্রাইস ডিসপ্লে (Clear Price Display) */}
              <div className="pt-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#16a34a]">
                    ৳ {unitPrice.toLocaleString('bn-BD')}
                  </span>
                  {hasGenuineDiscount && originalPrice > unitPrice && (
                    <span className="text-sm text-gray-400 line-through font-bold">
                      ৳ {originalPrice.toLocaleString('bn-BD')}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-medium">
                    / {product.unit_pack || product.unit || '১ একক'}
                  </span>
                </div>

                {hasGenuineDiscount && discountPercent > 0 && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">
                    আজকের বিশেষ অফার: আপনি সাশ্রয় করছেন ৳ {(originalPrice - unitPrice).toLocaleString('bn-BD')} ({discountPercent}%)
                  </p>
                )}
              </div>

              {/* সংক্ষিপ্ত বিবরণ (Short Description) */}
              {product.description && (
                <p className="text-xs leading-relaxed text-slate-600 pt-1">
                  {product.description}
                </p>
              )}

              {/* বিশেষ আকর্ষণ ও উপকারিতা (Key Highlights) */}
              {highlightsList.length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    বিশেষ আকর্ষণ ও উপকারিতা:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {highlightsList.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ২. প্রোডাক্ট ক্রয় ও কার্ট অ্যাকশন বক্স (Product Actions & Cart Box)
                - No order input fields (Quantity, Name, Phone, Address) on the main page.
                - Only primary action buttons: "এখনই কিনুন" (Buy Now) and "কার্টে যোগ করুন" (Add to Cart).
                - "এখনই কিনুন" opens the Quick Checkout Modal. */}
            <div 
              id="product-actions-box" 
              className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-500/30 shadow-2xs space-y-4"
            >
              {/* পরিমাণ নির্বাচন (Quantity Selector with + and -) */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-800 block">
                    পণ্যের পরিমাণ (Quantity):
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {quantity} {product.unit_pack || product.unit || 'একক'} (স্টকে আছে: {product.stock_quantity ?? product.stockQuantity ?? 99} টি)
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-gray-300 shadow-2xs">
                  <button
                    type="button"
                    onClick={handleQuantityDecrement}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center font-black transition active:scale-90 cursor-pointer"
                    title="পরিমাণ কমান"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-sm font-black text-slate-900 w-7 text-center font-mono">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={handleQuantityIncrement}
                    disabled={quantity >= (product.stock_quantity ?? product.stockQuantity ?? 99)}
                    className="w-8 h-8 rounded-lg bg-[#16a34a] hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center font-black transition active:scale-90 cursor-pointer"
                    title="পরিমাণ বাড়ান"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* মোট মূল্য লাইভ ডিসপ্লে */}
              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">
                  মোট প্রদেয় মূল্য (Total):
                </span>
                <div className="text-right">
                  <span className="text-lg font-black text-[#16a34a]">
                    ৳ {dynamicTotalPrice.toLocaleString('bn-BD')}
                  </span>
                  {quantity > 1 && (
                    <span className="text-[10px] text-slate-500 block font-normal">
                      (৳ {unitPrice.toLocaleString('bn-BD')} × {quantity})
                    </span>
                  )}
                </div>
              </div>

              {/* প্রাইমারি অ্যাকশন বাটনসমূহ (Primary Action Buttons) */}
              <div className="space-y-2.5 pt-1">
                {/* এখনই কিনুন Button (Primary CTA) -> Launches Quick Checkout Modal */}
                <button
                  type="button"
                  onClick={handleOpenQuickCheckout}
                  className="w-full bg-[#16a34a] hover:bg-emerald-700 text-white font-black text-sm py-3.5 px-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-buy-now-trigger"
                >
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>এখনই কিনুন (Buy Now)</span>
                </button>

                {/* কার্টে যোগ করুন Button (Secondary CTA) */}
                <button
                  type="button"
                  onClick={handleAddToCartAction}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs py-3 px-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-add-to-cart-trigger"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-700" />
                  <span>কার্টে যোগ করুন (Add to Cart)</span>
                </button>
              </div>

              {/* গ্যারান্টি ও ট্রাস্ট ব্যাজ */}
              <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-2 text-[10px] text-slate-600 text-center">
                <div className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-slate-50 border border-gray-100">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">দ্রুত কুরিয়ার</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-slate-50 border border-gray-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">ক্যাশ অন ডেলিভারি</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-slate-50 border border-gray-100">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">01870592699</span>
                </div>
              </div>

              {/* বিক্রেতা ও সরবরাহকারী কার্ড (Store & Seller Block) */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/90 border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block leading-none mb-0.5">মার্চেন্ট / বিক্রেতা:</span>
                    <span className="text-xs font-bold text-slate-900 leading-tight block">
                      {product.seller_info || product.seller?.name || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" /> ভেরিফাইড
                </span>
              </div>
            </div>

          </div>

        </section>

        {/* =========================================================================
            B. VERTICAL SECTIONS (Details, Specs & Reviews - No Horizontal Scroll)
            Section 1: পণ্যের বিস্তারিত বিবরণ ও উৎপাদন তথ্য (Product Description & Production Info)
            Section 2: পণ্য স্পেসিফিকেশন ও তথ্যসূচি (Product Specifications & Attributes)
            Section 3: গ্রাহক রিভিউ ও রেটিং (Customer Reviews & Ratings)
            ========================================================================= */}
        <div className="space-y-8">
          
          {/* Section 1: পণ্যের বিস্তারিত বিবরণ ও উৎপাদন তথ্য */}
          <section id="section-product-description" className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="border-b border-gray-100 bg-slate-50/70 px-5 sm:px-6 py-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Package className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  ১. পণ্যের বিস্তারিত বিবরণ ও উৎপাদন তথ্য (Product Description & Production Info)
                </h2>
                <p className="text-[11px] text-slate-500">
                  উৎপাদন প্রণালী, উপাদান ও ব্যবহারের প্রয়োজনীয় নির্দেশনা
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {product.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-slate-900">
                    পণ্যের মূল পরিচিতি (Product Overview)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* বিশেষ আকর্ষণ ও উপকারিতা (Key Highlights) */}
              {highlightsList.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2.5">
                  <h4 className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>বিশেষ আকর্ষণ ও উপকারিতা (Key Highlights)</span>
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                    {highlightsList.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug font-medium">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* উৎপাদন ও সংগ্রহ প্রণালী (How it is produced) */}
              {(product.how_it_is_produced || product.productionMethod) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-2">
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>উৎপাদন ও সংগ্রহ প্রণালী (How It is Produced)</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {product.how_it_is_produced || product.productionMethod}
                  </p>
                </div>
              )}

              {/* উপাদান ও ব্যবহার বিধি (Materials & Usage Instructions) */}
              {((product.materials_and_ingredients || product.materials) || (product.usage_and_storage || product.usageInstructions)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(product.materials_and_ingredients || product.materials) && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>উপাদান ও বৈশিষ্ট্য (Materials & Ingredients)</span>
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {product.materials_and_ingredients || product.materials}
                      </p>
                    </div>
                  )}

                  {(product.usage_and_storage || product.usageInstructions) && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>ব্যবহার ও সংরক্ষণ বিধি (Usage & Storage)</span>
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {product.usage_and_storage || product.usageInstructions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Section 2: পণ্য স্পেসিফিকেশন ও তথ্যসূচি */}
          <section id="section-product-specs" className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="border-b border-gray-100 bg-slate-50/70 px-5 sm:px-6 py-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Tag className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  ২. পণ্য স্পেসিফিকেশন ও তথ্যসূচি (Product Specifications & Attributes)
                </h2>
                <p className="text-[11px] text-slate-500">
                  প্রোডাক্ট কোড, একক, গুণমান ও সরবরাহকারী সংক্রান্ত তথ্য
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-600 w-1/3">প্রোডাক্ট কোড (SKU)</td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900">{product.sku || product.code || autoProductCode}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-600">ক্যাটাগরি (Category)</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{product.categoryLabelBn || product.category || 'জৈব ও পাহাড়ি পণ্য'}</td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-600">একক / পরিমাপ (Unit / Pack)</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{product.unit_pack || product.unit || '১ একক'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-600">উৎপাদন স্থল (Origin)</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{product.origin || product.originLocation || 'পার্বত্য চট্টগ্রাম'}</td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-600">গুণগত মান (Quality Standard)</td>
                      <td className="py-3 px-4 font-medium text-emerald-800 font-bold">{product.quality_standard || product.qualityGrade || '১০০% বিশুদ্ধ ও পরীক্ষিত'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-600">স্টক অবস্থা (Stock Status)</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {((product.stock_quantity ?? product.stockQuantity ?? 0) > 0)
                          ? `স্টকে পর্যাপ্ত রয়েছে (${product.stock_quantity ?? product.stockQuantity} টি)`
                          : 'স্টক সমাপ্ত (Out of Stock)'}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-600">সরবরাহকারী / বিক্রেতা</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{product.seller_info || product.seller?.name || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক'}</td>
                    </tr>

                    {/* Expiry Date field is OPTIONAL — ONLY display if explicitly provided by seller/listing */}
                    {product.expiryDate && product.expiryDate.trim().length > 0 && (
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>মেয়াদ উত্তীর্ণের তারিখ (Expiry Date)</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-amber-900 font-bold">
                          {product.expiryDate}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 3: গ্রাহক রিভিউ ও রেটিং */}
          <section id="section-product-reviews" className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="border-b border-gray-100 bg-slate-50/70 px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    ৩. গ্রাহক রিভিউ ও রেটিং (Customer Reviews & Ratings)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    প্রকৃত ক্রেতাদের অভিজ্ঞতার আলোকে পণ্য রেটিং
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWriteReviewOpen(!isWriteReviewOpen)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold py-2 px-3.5 rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                {isWriteReviewOpen ? 'ফর্ম বন্ধ করুন' : 'মতামত বা রিভিউ লিখুন'}
              </button>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {/* Loading State */}
              {isLoadingReviews && (
                <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium">রিভিউ লোড হচ্ছে...</span>
                </div>
              )}

              {/* রেটিং সামারি বক্স (Dynamic Rating Card - ONLY when real reviews exist) */}
              {!isLoadingReviews && totalReviewsCount > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-gray-200">
                  <div className="text-center sm:border-r border-gray-200 sm:pr-4 flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">{avgRatingDisplay}</span>
                    <div className="flex items-center text-amber-400 my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-4 h-4 ${s <= Math.round(avgRatingNum) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      মোট {totalReviewsCount} জন ক্রেতার রেটিং
                    </span>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-slate-600 font-medium">৫ স্টার</span>
                      <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${pct5}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold text-slate-700">{pct5}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-slate-600 font-medium">৪ স্টার</span>
                      <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${pct4}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold text-slate-700">{pct4}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-slate-600 font-medium">৩ স্টার</span>
                      <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${pct3}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold text-slate-700">{pct3}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-slate-600 font-medium">২ স্টার</span>
                      <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${pct2}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold text-slate-700">{pct2}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-slate-600 font-medium">১ স্টার</span>
                      <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${pct1}%` }} />
                      </div>
                      <span className="w-8 text-right font-bold text-slate-700">{pct1}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Honest Empty State for 0 reviews */}
              {!isLoadingReviews && totalReviewsCount === 0 && (
                <div className="text-center py-10 px-4 bg-slate-50/70 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1 max-w-sm text-center">
                    <p className="text-sm font-bold text-slate-800">
                      এখনো কোনো গ্রাহক রিভিউ দেননি। আপনি প্রথম রিভিউ দিন!
                    </p>
                    <p className="text-xs text-slate-500">
                      আপনার কেনাকাটা ও পণ্যের বাস্তব অভিজ্ঞতা অন্যান্য পাহাড়ি পণ্যপ্রেমীদের সঠিক পণ্য বেছে নিতে সহায়তা করবে।
                    </p>
                  </div>
                  {!isWriteReviewOpen && (
                    <button
                      type="button"
                      onClick={() => setIsWriteReviewOpen(true)}
                      className="mt-2 inline-flex items-center gap-2 bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>মতামত বা রিভিউ লিখুন</span>
                    </button>
                  )}
                </div>
              )}

              {/* Write Review Form */}
              {isWriteReviewOpen && (
                <form onSubmit={handleReviewSubmit} className="p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-emerald-900">
                      আপনার মূল্যবান রিভিউ ও অভিজ্ঞতা শেয়ার করুন
                    </h4>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md font-semibold">
                      সরাসরি ডেটাবেজে সংরক্ষিত হবে
                    </span>
                  </div>

                  {reviewSubmitSuccess && (
                    <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>আপনার রিভিউ সফলভাবে যুক্ত হয়েছে! ধন্যবাদ।</span>
                    </div>
                  )}

                  {reviewSubmitError && (
                    <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>{reviewSubmitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        আপনার নাম {currentUser ? '(লগইন কৃত)' : ''}
                      </label>
                      <input 
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="আপনার নাম লিখুন"
                        className="w-full text-xs px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        স্টার রেটিং (১ থেকে ৫)
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewRating(s)}
                            className="cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      আপনার মন্তব্য / অভিজ্ঞতা
                    </label>
                    <textarea 
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="পণ্যটির আসল পাহাড়ি স্বাদ, মান ও ডেলিভারি অভিজ্ঞতা সম্পর্কে লিখুন..."
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="bg-[#16a34a] hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isSubmittingReview ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{isSubmittingReview ? 'জমা হচ্ছে...' : 'রিভিউ জমা দিন'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWriteReviewOpen(false)}
                      className="text-xs text-slate-600 hover:text-slate-800 font-bold py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
                    >
                      বাতিল করুন
                    </button>
                  </div>
                </form>
              )}

              {/* রিভিউ তালিকা (Customer Reviews List) */}
              {!isLoadingReviews && totalReviewsCount > 0 && (
                <div className="space-y-3 pt-1">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                          {rev.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">{rev.name}</span>
                            {rev.verifiedPurchase && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                ভেরিফাইড ক্রেতা
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{rev.location} • {rev.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
              )}
            </div>
          </section>

        </div>

      </main>

      {/* =========================================================================
          C. স্টিকি বটম অ্যাকশন বার (Sticky Bottom Action Bar - Mobile & Desktop)
          - Product Price Display (Unit price & dynamic total)
          - 'কার্টে যোগ করুন' (Add to Cart) Button
          - 'এখনই কিনুন' (Buy Now) Button (triggers Quick Checkout Modal)
          ========================================================================= */}
      <div 
        id="sticky-product-bottom-bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2.5 sm:py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* মূল্য সংক্ষিপ্ত তথ্য */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-slate-50 hidden xs:block sm:block">
              <img 
                src={getProductPublicUrl(images[0] || product.image)} 
                alt={product.nameBn || product.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = NO_IMAGE_AVAILABLE_ICON;
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-xl font-black text-[#16a34a] leading-none">
                  ৳ {dynamicTotalPrice.toLocaleString('bn-BD')}
                </span>
                {hasGenuineDiscount && originalPrice > unitPrice && (
                  <span className="text-[11px] text-gray-400 line-through font-medium hidden sm:inline">
                    ৳ {(originalPrice * quantity).toLocaleString('bn-BD')}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate block">
                {quantity} {product.unit || 'একক'} • স্টকে আছে
              </span>
            </div>
          </div>

          {/* অ্যাকশন বাটনসমূহ */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={handleAddToCartAction}
              className="bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="কার্টে যোগ করুন"
              id="btn-sticky-add-to-cart"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">কার্টে যোগ করুন</span>
              <span className="sm:hidden">কার্টে যোগ</span>
            </button>

            <button
              type="button"
              onClick={handleOpenQuickCheckout}
              className="bg-[#16a34a] hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm py-2.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="এখনই কিনুন"
              id="btn-sticky-buy-now"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>এখনই কিনুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          D. কুইক চেকআউট পপআপ/মডাল (Quick Checkout Modal / Popup)
          - Opens when clicking "এখনই কিনুন" (Buy Now) from either the top card or sticky bar.
          - Contains all Order input fields: Quantity, Name, Phone, Address, Payment, Courier.
          ========================================================================= */}
      {isQuickCheckoutOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-checkout-modal-title"
        >
          <div 
            className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-200 relative my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                </div>
                <div>
                  <h3 id="quick-checkout-modal-title" className="text-sm sm:text-base font-black text-slate-900">
                    সরাসরি অর্ডার করুন (Quick Checkout)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    নিচের তথ্য পূরণ করে ১-ক্লিকে অর্ডার নিশ্চিত করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Product Summary Box */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 mb-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0">
                <img 
                  src={getProductPublicUrl(images[0] || product.image)} 
                  alt={product.nameBn || product.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = NO_IMAGE_AVAILABLE_ICON;
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-900 truncate">
                  {product.nameBn || product.name}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  কোড: {autoProductCode} • একক মূল্য: ৳ {unitPrice.toLocaleString('bn-BD')}
                </p>

                {/* Modal Quantity Stepper */}
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-200/70">
                  <div className="flex items-center gap-1.5 bg-white px-1.5 py-0.5 rounded-lg border border-gray-300">
                    <button
                      type="button"
                      onClick={handleQuantityDecrement}
                      disabled={quantity <= 1}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center text-xs font-bold transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 px-1 font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={handleQuantityIncrement}
                      disabled={quantity >= (product.stockQuantity || 99)}
                      className="w-6 h-6 rounded bg-[#16a34a] hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center text-xs font-bold transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs font-black text-[#16a34a]">
                    মোট: ৳ {dynamicTotalPrice.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Checkout Form */}
            <form onSubmit={handleConfirmOrderSubmit} className="space-y-3.5">
              {/* Error Message */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}

              {/* Customer Inputs */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    আপনার পুরো নাম <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="যেমন: মোঃ জসিম উদ্দিন"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="018XXXXXXXX (১১ ডিজিটের মোবাইল নম্বর)"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ডেলিভারির পূর্ণাঙ্গ ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="বাড়ি/গ্রাম, সড়ক, থানা/উপজেলা ও জেলা"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 resize-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-800 block">
                  পেমেন্ট পদ্ধতি নির্বাচন করুন (Payment Method)
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('cod')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentType === 'cod' 
                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-500' 
                        : 'border-gray-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black text-slate-900">ক্যাশ অন ডেলিভারি</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        paymentType === 'cod' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                      }`}>
                        {paymentType === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-[9.5px] text-slate-500 mt-1">পণ্য হাতে পেয়ে মূল্য দিন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('digital')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentType === 'digital' 
                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-500' 
                        : 'border-gray-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black text-slate-900">ডিজিটাল পেমেন্ট</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        paymentType === 'digital' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                      }`}>
                        {paymentType === 'digital' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-[9.5px] text-slate-500 mt-1">বিকাশ / নগদ / কার্ড</span>
                  </button>
                </div>

                {paymentType === 'digital' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDigitalGateway('bkash')}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                          digitalGateway === 'bkash' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-700 border-gray-200'
                        }`}
                      >
                        বিকাশ (bKash)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDigitalGateway('nagad')}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                          digitalGateway === 'nagad' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-700 border-gray-200'
                        }`}
                      >
                        নগদ (Nagad)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDigitalGateway('card')}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                          digitalGateway === 'card' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-gray-200'
                        }`}
                      >
                        কার্ড (Card)
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      {digitalGateway === 'bkash' && 'বিকাশ নম্বর: 01870592699 (পার্সোনাল)। রেফারেন্সে আপনার নাম লিখুন।'}
                      {digitalGateway === 'nagad' && 'নগদ নম্বর: 01870592699 (ওয়ালেট)। রেফারেন্সে আপনার নাম লিখুন।'}
                      {digitalGateway === 'card' && 'ভিসা বা মাস্টারকার্ড দ্বারা পেমেন্ট করতে পারবেন।'}
                    </p>
                  </div>
                )}
              </div>

              {/* Courier Selection */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>ডেলিভারি কুরিয়ার (ঐচ্ছিক)</span>
                  <span className="text-[9px] text-slate-400">সুন্দরবন, এসএ, পাঠাও ইত্যাদি</span>
                </label>
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  {BANGLADESH_COURIERS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} {c.estTime ? `(${c.estTime})` : ''}
                    </option>
                  ))}
                </select>

                {selectedCourier.includes('অন্যান্য') && (
                  <input 
                    type="text"
                    value={customCourierName}
                    onChange={(e) => setCustomCourierName(e.target.value)}
                    placeholder="কুরিয়ার সার্ভিসের নাম লিখুন"
                    className="w-full text-xs px-3 py-2 mt-1.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                )}
              </div>

              {/* Submit Order Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#16a34a] hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm py-3 px-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-modal-checkout-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>অর্ডার সম্পন্ন হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>এখনই অর্ডার নিশ্চিত করুন (৳ {dynamicTotalPrice.toLocaleString('bn-BD')})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Trust Badge Footer */}
              <div className="flex items-center justify-around text-[10px] text-slate-500 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-emerald-600" />
                  দ্রুত ডেলিভারি
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  দেখে নেওয়ার সুবিধা
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  হেল্পলাইন: 01870592699
                </span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          D. পোস্ট-সাবমিশন কনফার্মেশন ও রসিদ মডাল (Order Receipt & WhatsApp Sync)
          ========================================================================= */}
      {confirmedOrder && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmed-order-receipt-title"
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-gray-200 text-center space-y-4">
            
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 id="confirmed-order-receipt-title" className="text-base font-black text-slate-900">
                অর্ডার সফলভাবে নিশ্চিত হয়েছে!
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                আপনার অর্ডারটি ডাটাবেজে রেকর্ড করা হয়েছে ও কুরিয়ারে প্রসেস করা হচ্ছে।
              </p>
            </div>

            {/* অর্ডার সারাংশ রসিদ */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center pb-1 border-b border-gray-200">
                <span className="font-bold text-slate-500">অর্ডার আইডি:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-emerald-700">#{confirmedOrder.orderId}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(confirmedOrder.orderId);
                      }
                      setCopiedToast(true);
                      setTimeout(() => setCopiedToast(false), 2000);
                    }}
                    className="p-1 text-slate-500 hover:text-emerald-700 rounded bg-slate-200/70 hover:bg-slate-200 cursor-pointer active:scale-95"
                    title="অর্ডার আইডি কপি করুন"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">প্রোডাক্ট কোড (SKU):</span>
                <span className="font-mono font-black text-slate-800">{confirmedOrder.productCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">পণ্য:</span>
                <span className="font-bold text-slate-800 truncate max-w-[180px]">{confirmedOrder.productName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">পরিমাণ:</span>
                <span className="font-black text-slate-800">{confirmedOrder.quantity} টি</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">কুরিয়ার:</span>
                <span className="font-bold text-slate-800 truncate max-w-[180px]">{confirmedOrder.courier}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200 text-sm font-black">
                <span className="text-slate-800">মোট প্রদেয়:</span>
                <span className="text-[#16a34a]">৳ {confirmedOrder.totalAmount.toLocaleString('bn-BD')}</span>
              </div>
            </div>

            {/* সিস্টেম এক্সিকিউশন অ্যাকশন চেকপয়েন্ট */}
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-left text-[10px] space-y-1 text-emerald-900">
              <p className="flex items-center gap-1.5 font-bold">
                <Check className="w-3 h-3 text-emerald-600" />
                অ্যাডমিন ড্যাশবোর্ডে অর্ডার তাৎক্ষণিক আপডেট হয়েছে।
              </p>
              <p className="flex items-center gap-1.5 font-bold">
                <Check className="w-3 h-3 text-emerald-600" />
                ক্যাশ অন ডেলিভারিতে দ্রুত কুরিয়ারে পণ্য পাঠানো হচ্ছে।
              </p>
            </div>

            {/* অ্যাকশন বাটনসমূহ */}
            <div className="space-y-2 pt-1">
              <a
                href={confirmedOrder.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>হোয়াটসঅ্যাপে অর্ডার মেসেজ দেখুন (01870592699)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  onBack();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                পণ্য তালিকায় ফিরে যান
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailsScreen;
