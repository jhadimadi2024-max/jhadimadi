import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Plus, Search, Edit3, Trash2, CheckCircle2, 
  Sparkles, X, Send, Zap, Utensils, Shirt, Home, Tag, 
  AlertCircle, Eye, EyeOff, UploadCloud, Image as ImageIcon,
  Video, Film, Check, Trash, ShieldCheck, FileText, Info,
  Database, Layers, CloudLightning, ChevronRight, ChevronLeft, ListPlus, Sliders, LayoutList, MapPin,
  Loader2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StoreProduct, sortProductsAscending } from '../../data/productsData';
import { compressImage } from '../../utils/imageUtils';
import { SupabaseMediaPickerModal } from './SupabaseMediaPickerModal';
import { AdminUploadForm } from './AdminUploadForm';
import { supabaseMediaService } from '../../services/supabaseMediaService';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { submitFormData } from '../../services/unifiedRegistrationService';
import { getProductPublicUrl } from '../../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../../constants/imageConstants';
import { resilientSupabaseUpsert, resilientSupabaseDelete } from '../../services/supabaseDbHelper';

interface AdminProductsTabProps {
  onShowToast: (msg: string) => void;
  onPreviewProduct?: (prod: StoreProduct) => void;
  initialImageUrl?: string;
  onClearInitialImage?: () => void;
}

// ক্যাটাগরি তালিকা (Exact Refined Final 16 Categories)
export const PRODUCT_CATEGORIES = [
  { value: 'RealEstate', labelBn: 'রিয়েল এস্টেট' },
  { value: 'Clothing', labelBn: 'পোশাক-আশাক / ড্রেস' },
  { value: 'Food', labelBn: 'ফুড ও খাবার' },
  { value: 'Vehicles', labelBn: 'গাড়ি ও যানবাহন' },
  { value: 'Services', labelBn: 'পেশাদার সেবা' },
  { value: 'Electronics', labelBn: 'ইলেকট্রনিক্স' },
  { value: 'Jewelry', labelBn: 'গহনা ও অলংকার' },
  { value: 'HouseRent', labelBn: 'বাসা ভাড়া' },
  { value: 'Education', labelBn: 'টিউশনি ও শিক্ষা' },
  { value: 'Agri', labelBn: 'কৃষি ও পাহাড়ি শিল্প' },
  { value: 'Crafts', labelBn: 'হস্তশিল্প' },
  { value: 'Tour', labelBn: 'ট্যুর ও ট্রাভেলিং' },
  { value: 'HotelRestaurant', labelBn: 'হোটেল ও রেস্টুরেন্ট' },
  { value: 'VetAnimalCare', labelBn: 'পশুপাখি চিকিৎসা' },
  { value: 'HealthBeauty', labelBn: 'স্বাস্থ্য ও রূপচর্চা' },
  { value: 'Jobs', labelBn: 'চাকরি' },
];

export const getCategoryLabel = (catValue: string): string => {
  if (!catValue) return 'ফুড ও খাবার';
  const found = PRODUCT_CATEGORIES.find(c => c.value === catValue || c.labelBn === catValue);
  if (found) return found.labelBn;
  // Backward compatibility mappings
  if (catValue === 'SpicesGrains' || catValue === 'ShutkiSidol') return 'ফুড ও খাবার';
  if (catValue === 'Organic' || catValue === 'Health' || catValue === 'Cosmetics' || catValue === 'Medicines') return 'স্বাস্থ্য ও রূপচর্চা';
  if (catValue === 'CraftsHoney') return 'হস্তশিল্প';
  if (catValue === 'Jhum' || catValue === 'Fruits') return 'কৃষি ও পাহাড়ি শিল্প';
  if (catValue === 'Livestock' || catValue === 'pashupakhi') return 'পশুপাখি চিকিৎসা';
  if (catValue === 'Books') return 'টিউশনি ও শিক্ষা';
  if (catValue === 'Furniture' || catValue === 'Construction') return 'রিয়েল এস্টেট';
  return catValue;
};

// স্বয়ংক্রিয় ইউনিক প্রোডাক্ট কোড জেনারেটর (e.g. 001, 002, 003...)
export const generateNextProductCode = (allProducts: StoreProduct[]): string => {
  let highestNum = 0;
  for (const p of allProducts) {
    if (p.code) {
      const match = p.code.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > highestNum) {
          highestNum = num;
        }
      }
    }
  }
  const nextNum = highestNum > 0 ? highestNum + 1 : (allProducts.length + 1);
  return String(nextNum).padStart(3, '0');
};

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({ 
  onShowToast,
  onPreviewProduct,
  initialImageUrl,
  onClearInitialImage
}) => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductPublishStatus,
    setActiveDraftPreview 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // Handle incoming image from Media Gallery
  useEffect(() => {
    if (initialImageUrl && initialImageUrl.trim()) {
      startNewProduct();
      setProductForm(prev => ({
        ...prev,
        image: initialImageUrl.trim(),
        images: [initialImageUrl.trim()]
      }));
      setActiveFormTab('basic');
      if (onClearInitialImage) {
        onClearInitialImage();
      }
    }
  }, [initialImageUrl]);

  // File Upload & Supabase Media Picker State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const isUploadingRef = useRef<boolean>(false);
  const [isSupabasePickerOpen, setIsSupabasePickerOpen] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDirectUploadModal, setShowDirectUploadModal] = useState(false);

  // Active form section tab: Basic, Media, Highlights, Specs, Overview, All
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'media' | 'highlights' | 'specs' | 'overview' | 'all'>('basic');
  const [customBadgeInput, setCustomBadgeInput] = useState('');
  const [customHighlightInput, setCustomHighlightInput] = useState('');

  // YouTube embed helper for live preview
  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    try {
      const trimmed = url.trim();
      if (trimmed.includes('youtu.be/')) {
        const id = trimmed.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (trimmed.includes('youtube.com/watch')) {
        const match = trimmed.match(/[?&]v=([^&]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
      }
      if (trimmed.includes('youtube.com/embed/')) {
        return trimmed;
      }
      if (trimmed.includes('youtube.com/shorts/')) {
        const id = trimmed.split('youtube.com/shorts/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    } catch {
      return null;
    }
    return null;
  };

  // Preset badging options
  const PRESET_BADGES = [
    'ঘরে তৈরি (Homemade)',
    '১০০% খাঁটি ও পরীক্ষিত',
    'নতুন কালেকশন',
    'সীমিত স্টক',
    'পাহাড়ি অর্গানিক',
    'কেমিক্যাল মুক্ত',
    'হ্যান্ডমেড স্পেশাল'
  ];

  // Preset key highlights suggestions
  const PRESET_HIGHLIGHTS = [
    '১০০% প্রাকৃতিক ও প্রিজারভেটিভ বা ক্ষতিকর কেমিক্যাল মুক্ত।',
    'খাগড়াছড়ি ও পাহাড়ি বাগান থেকে সরাসরি সংগৃহীত।',
    'উন্নত প্রক্রিয়াজাতকরণে ধুলোবালি ও পাথর মুক্ত পরিচ্ছন্ন দানা।',
    'সহজে হজমযোগ্য এবং শরীরের প্রয়োজনীয় পুষ্টি ও শক্তি যোগায়।',
    'সরাসরি কৃষক ও স্থানীয় উদ্যোক্তার কাছ থেকে সংগৃহীত।'
  ];

  // Product Form State adhering strictly to dynamic schema
  const [productForm, setProductForm] = useState<{
    code: string;
    sku: string;
    title_bn: string;
    title_en: string;
    nameBn: string;
    nameEn: string;
    category: string;
    categoryLabelBn: string;
    price: number;
    discount_price: number;
    originalPrice: number;
    unit_pack: string;
    stock_quantity: number;
    badges: string[];
    key_highlights: string[];
    how_it_is_produced: string;
    materials_and_ingredients: string;
    usage_and_storage: string;
    origin: string;
    quality_standard: string;
    seller_info: string;
    videoUrl: string;
    image: string;
    images: string[];
    badge: string;
    badgeColor: string;
    descriptionBn: string;
    descriptionEn: string;
  }>({
    code: '001',
    sku: 'JDM-001',
    title_bn: '',
    title_en: '',
    nameBn: '',
    nameEn: '',
    category: 'Food',
    categoryLabelBn: 'ফুড ও খাবার',
    price: 0,
    discount_price: 0,
    originalPrice: 0,
    unit_pack: '৫০০ গ্রাম',
    stock_quantity: 50,
    badges: ['ঘরে তৈরি (Homemade)', '১০০% খাঁটি ও পরীক্ষিত'],
    key_highlights: [
      '১০০% প্রাকৃতিক ও প্রিজারভেটিভ বা ক্ষতিকর কেমিক্যাল মুক্ত।',
      'খাগড়াছড়ি ও পাহাড়ি বাগান থেকে সরাসরি সংগৃহীত।'
    ],
    how_it_is_produced: '',
    materials_and_ingredients: '',
    usage_and_storage: '',
    origin: 'পার্বত্য চট্টগ্রাম',
    quality_standard: '১০০% বিশুদ্ধ ও পরীক্ষিত',
    seller_info: 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক',
    videoUrl: '',
    image: '',
    images: [],
    badge: 'ঘরে তৈরি (Homemade)',
    badgeColor: 'bg-emerald-600',
    descriptionBn: '',
    descriptionEn: ''
  });

  // Helper to get current draft product object
  const getCurrentDraftProduct = (): StoreProduct => {
    const primaryImg = productForm.image || (productForm.images[0] || '');
    const finalTitleBn = (productForm.title_bn || productForm.nameBn).trim() || 'নতুন পণ্য';
    const finalTitleEn = (productForm.title_en || productForm.nameEn).trim();
    const finalSku = (productForm.sku || productForm.code).trim() || `JDM-${productForm.code}`;
    const finalUnit = productForm.unit_pack.trim() || '১ পিস';
    const finalPrice = Number(productForm.price) || 0;
    const finalDiscountPrice = Number(productForm.discount_price) || 0;

    return {
      id: editingProduct ? editingProduct.id : 'preview_draft_prod',
      code: productForm.code,
      sku: finalSku,
      nameBn: finalTitleBn,
      nameEn: finalTitleEn,
      title_bn: finalTitleBn,
      title_en: finalTitleEn,
      category: productForm.category,
      categoryLabelBn: productForm.categoryLabelBn,
      price: finalPrice,
      discount_price: finalDiscountPrice > 0 ? finalDiscountPrice : undefined,
      discountPrice: finalDiscountPrice > 0 ? finalDiscountPrice : undefined,
      originalPrice: Number(productForm.originalPrice) || finalPrice,
      unit: finalUnit,
      unit_pack: finalUnit,
      stock: Number(productForm.stock_quantity) || 0,
      stock_quantity: Number(productForm.stock_quantity) || 0,
      origin: productForm.origin.trim() || 'পার্বত্য চট্টগ্রাম',
      productionOrigin: productForm.origin.trim() || 'পার্বত্য চট্টগ্রাম',
      production_origin: productForm.origin.trim() || 'পার্বত্য চট্টগ্রাম',
      quality_standard: productForm.quality_standard.trim() || '১০০% বিশুদ্ধ ও পরীক্ষিত',
      qualityStandards: productForm.quality_standard.trim() || '১০০% বিশুদ্ধ ও পরীক্ষিত',
      seller_info: productForm.seller_info.trim() || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক',
      badges: productForm.badges,
      badge: productForm.badges[0] || undefined,
      badgeColor: productForm.badgeColor,
      key_highlights: productForm.key_highlights,
      features: productForm.key_highlights,
      how_it_is_produced: productForm.how_it_is_produced.trim(),
      materials_and_ingredients: productForm.materials_and_ingredients.trim(),
      usage_and_storage: productForm.usage_and_storage.trim(),
      videoUrl: productForm.videoUrl.trim(),
      image: primaryImg,
      images: productForm.images.length > 0 ? productForm.images : [primaryImg],
      description: productForm.descriptionBn.trim(),
      descriptionBn: productForm.descriptionBn.trim(),
      descriptionEn: productForm.descriptionEn.trim(),
      isPublished: true,
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 1,
    };
  };

  // Real-time live draft broadcasting to mobile preview monitor
  useEffect(() => {
    if (isCreating || editingProduct) {
      const draft = getCurrentDraftProduct();
      setActiveDraftPreview({
        type: 'product',
        data: draft
      });
    } else {
      setActiveDraftPreview(null);
    }
    return () => {
      setActiveDraftPreview(null);
    };
  }, [productForm, isCreating, editingProduct, setActiveDraftPreview]);

  const startNewProduct = (categoryKey?: string) => {
    setEditingProduct(null);
    const nextCode = generateNextProductCode(products);
    const cat = categoryKey || 'Food';
    const catLabel = getCategoryLabel(cat);

    setProductForm({
      code: nextCode,
      sku: `JDM-${nextCode}`,
      title_bn: '',
      title_en: '',
      nameBn: '',
      nameEn: '',
      category: cat,
      categoryLabelBn: catLabel,
      price: 0,
      discount_price: 0,
      originalPrice: 0,
      unit_pack: cat === 'RealEstate' ? '১ শতক / ডেসিমাল' : '৫০০ গ্রাম',
      stock_quantity: 50,
      badges: ['ঘরে তৈরি (Homemade)', '১০০% খাঁটি ও পরীক্ষিত'],
      key_highlights: [
        '১০০% প্রাকৃতিক ও প্রিজারভেটিভ বা ক্ষতিকর কেমিক্যাল মুক্ত।',
        'খাগড়াছড়ি ও পাহাড়ি বাগান থেকে সরাসরি সংগৃহীত।'
      ],
      how_it_is_produced: '',
      materials_and_ingredients: '',
      usage_and_storage: '',
      origin: 'পার্বত্য চট্টগ্রাম',
      quality_standard: '১০০% বিশুদ্ধ ও পরীক্ষিত',
      seller_info: 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক',
      videoUrl: '',
      image: '',
      images: [],
      badge: 'ঘরে তৈরি (Homemade)',
      badgeColor: 'bg-emerald-600',
      descriptionBn: '',
      descriptionEn: ''
    });
    setActiveFormTab('basic');
    setCustomBadgeInput('');
    setCustomHighlightInput('');
    setUploadError(null);
    setIsCreating(true);
  };

  const startEditProduct = (prod: StoreProduct) => {
    setEditingProduct(prod);
    const prodIndex = products.findIndex(p => p.id === prod.id);
    const currentCode = prod.code || (prodIndex >= 0 ? String(prodIndex + 1).padStart(3, '0') : '001');

    const existingImages = Array.isArray(prod.images) && prod.images.length > 0 
      ? prod.images 
      : (prod.image ? [prod.image] : []);

    const existingBadges = Array.isArray(prod.badges) && prod.badges.length > 0
      ? prod.badges
      : (prod.badge ? [prod.badge] : ['১০০% খাঁটি ও পরীক্ষিত']);

    const existingHighlights = Array.isArray(prod.key_highlights) && prod.key_highlights.length > 0
      ? prod.key_highlights
      : (Array.isArray(prod.features) && prod.features.length > 0 ? prod.features : [
          '১০০% প্রাকৃতিক ও প্রিজারভেটিভ বা ক্ষতিকর কেমিক্যাল মুক্ত।',
          'সরাসরি কৃষক ও স্থানীয় উদ্যোক্তার কাছ থেকে সংগৃহীত।'
        ]);

    setProductForm({
      code: currentCode,
      sku: prod.sku || prod.code || `JDM-${currentCode}`,
      title_bn: prod.title_bn || prod.nameBn || '',
      title_en: prod.title_en || prod.nameEn || '',
      nameBn: prod.title_bn || prod.nameBn || '',
      nameEn: prod.title_en || prod.nameEn || '',
      category: prod.category || 'Food',
      categoryLabelBn: prod.categoryLabelBn || getCategoryLabel(prod.category || 'Food'),
      price: prod.price !== undefined && prod.price !== null ? prod.price : 0,
      discount_price: prod.discount_price !== undefined && prod.discount_price !== null ? prod.discount_price : (prod.discountPrice || 0),
      originalPrice: prod.originalPrice !== undefined && prod.originalPrice !== null ? prod.originalPrice : (prod.original_price || 0),
      unit_pack: prod.unit_pack || prod.unit || '৫০০ গ্রাম',
      stock_quantity: prod.stock_quantity ?? prod.stock ?? 50,
      badges: existingBadges,
      key_highlights: existingHighlights,
      how_it_is_produced: prod.how_it_is_produced || (prod as any).productionMethod || '',
      materials_and_ingredients: prod.materials_and_ingredients || (prod as any).materials || '',
      usage_and_storage: prod.usage_and_storage || (prod as any).usageInstructions || '',
      origin: prod.origin || prod.productionOrigin || 'পার্বত্য চট্টগ্রাম',
      quality_standard: prod.quality_standard || prod.qualityStandards || '১০০% বিশুদ্ধ ও পরীক্ষিত',
      seller_info: prod.seller_info || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক',
      videoUrl: prod.videoUrl || '',
      image: prod.image || (existingImages[0] || ''),
      images: existingImages,
      badge: prod.badge || (existingBadges[0] || ''),
      badgeColor: prod.badgeColor || 'bg-emerald-600',
      descriptionBn: prod.descriptionBn || prod.description || '',
      descriptionEn: prod.descriptionEn || ''
    });
    setActiveFormTab('basic');
    setCustomBadgeInput('');
    setCustomHighlightInput('');
    setUploadError(null);
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingProduct(null);
    setActiveDraftPreview(null);
    setUploadError(null);
  };

  // Supabase Media Picker selection handler
  const handleSupabaseMediaSelected = (selectedUrls: string[]) => {
    if (selectedUrls.length === 0) return;
    setProductForm(prev => {
      const combined = Array.from(new Set([...prev.images, ...selectedUrls]));
      return {
        ...prev,
        images: combined,
        image: prev.image && combined.includes(prev.image) ? prev.image : (combined[0] || '')
      };
    });
    onShowToast(`⚡ Supabase ডাটাবেজ থেকে ${selectedUrls.length}টি ছবি যুক্ত করা হয়েছে!`);
  };

  // Direct File Upload Handler (Uploads directly to Supabase Cloud Storage)
  const handleFilesSelected = async (files: FileList | File[]) => {
    if (isUploadingRef.current || isUploadingImages) {
      console.warn('[AdminProductsTab] Image upload already in progress.');
      return;
    }
    isUploadingRef.current = true;
    setIsUploadingImages(true);
    setUploadError(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) {
      isUploadingRef.current = false;
      setIsUploadingImages(false);
      return;
    }

    const validImageFiles = fileArray.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const safeExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
      return file.type.startsWith('image/') || safeExtensions.includes(ext);
    });

    if (validImageFiles.length === 0) {
      setUploadError('শুধুমাত্র ছবি ফাইল (PNG, JPG, JPEG, WebP) নির্বাচন করুন।');
      isUploadingRef.current = false;
      setIsUploadingImages(false);
      return;
    }
    try {
      const processedUrls: string[] = [];
      const errors: string[] = [];

      for (const file of validImageFiles) {
        if (file.size > 15 * 1024 * 1024) {
          errors.push(`${file.name}: ফাইলের সাইজ ১৫MB এর বেশি`);
          continue;
        }

        try {
          // ১. ফাইলের একটি ইউনিক নাম তৈরি করা
          const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `${fileName}`;

          let directUploadedUrl = '';

          // ২. সরাসরি Supabase Storage-এর 'products' বাক্সে আপলোড করা
          try {
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('products')
              .upload(filePath, file, { 
                cacheControl: '31536000', 
                upsert: true, 
                contentType: file.type || 'image/jpeg' 
              });

            if (!uploadErr && uploadData?.path) {
              // ৩. আপলোড হওয়া ছবির স্থায়ী পাবলিক (Public) URL বের করা
              const { data: pubData } = supabase.storage
                .from('products')
                .getPublicUrl(uploadData.path || filePath);

              if (pubData?.publicUrl) {
                directUploadedUrl = pubData.publicUrl;
              }
            } else if (uploadErr) {
              console.warn('[AdminProductsTab] Direct upload to products bucket notice:', uploadErr.message);
            }
          } catch (storageErr) {
            console.warn('[AdminProductsTab] Direct storage exception:', storageErr);
          }

          // ৪. Fallback to supabaseMediaService if direct bucket call needs alternate routing
          if (!directUploadedUrl) {
            const uploadRes = await supabaseMediaService.uploadToSupabase(file, editingProduct?.id);
            if (uploadRes.success && uploadRes.url) {
              directUploadedUrl = uploadRes.url;
            } else {
              errors.push(uploadRes.error || `${file.name} আপলোড ব্যর্থ হয়েছে`);
            }
          }

          if (directUploadedUrl) {
            processedUrls.push(directUploadedUrl);
          }
        } catch (itemErr: any) {
          errors.push(itemErr?.message || `${file.name} আপলোডে অপ্রত্যাশিত ত্রুটি`);
        }
      }

      if (errors.length > 0) {
        setUploadError(errors.join(' | '));
      }

      if (processedUrls.length > 0) {
        setProductForm(prev => {
          const updatedList = Array.from(new Set([...prev.images, ...processedUrls]));
          return {
            ...prev,
            images: updatedList,
            image: prev.image && updatedList.includes(prev.image) ? prev.image : updatedList[0]
          };
        });
        onShowToast(`⚡ Supabase ক্লাউডে ${processedUrls.length}টি ছবি সফলভাবে সংরক্ষিত হয়েছে!`);
      }
    } catch (err: any) {
      console.error('[AdminProductsTab] File upload error:', err);
      setUploadError(err?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      isUploadingRef.current = false;
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductForm(prev => {
      const updatedImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      let newMainImage = prev.image;
      if (prev.images[indexToRemove] === prev.image || !updatedImages.includes(prev.image)) {
        newMainImage = updatedImages[0] || '';
      }
      return {
        ...prev,
        images: updatedImages,
        image: newMainImage
      };
    });
  };

  const handleSetCoverImage = (imgUrl: string) => {
    setProductForm(prev => ({
      ...prev,
      image: imgUrl
    }));
    onShowToast('⭐ প্রধান কভার ছবি সেট করা হয়েছে!');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent duplicate triggers immediately
    if (isSubmittingRef.current || isSaving) {
      console.warn('[AdminProductsTab] Form submission blocked: already saving.');
      return;
    }
    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      const finalTitleBn = (productForm.title_bn || productForm.nameBn).trim();
      if (!finalTitleBn) {
        onShowToast('❌ পণ্যের বাংলা নাম আবশ্যক!');
        setActiveFormTab('basic');
        return;
      }

      const primaryImg = productForm.image || (productForm.images[0] || '');
      if (!primaryImg) {
        setUploadError('অনুগ্রহ করে অন্তত একটি পণ্যের ছবি আপলোড বা নির্বাচন করুন!');
        onShowToast('❌ অন্তত একটি পণ্যের ছবি আপলোড বা নির্বাচন করুন!');
        setActiveFormTab('basic');
        return;
      }

      const finalTitleEn = (productForm.title_en || productForm.nameEn).trim();
      const finalSku = (productForm.sku || productForm.code).trim() || `JDM-${productForm.code}`;
      const finalUnit = productForm.unit_pack.trim() || '১ পিস';
      const finalPrice = Number(productForm.price) || 0;
      const finalDiscountPrice = Number(productForm.discount_price) || 0;
      const fullImagesList = productForm.images.length > 0 ? productForm.images : [primaryImg];
      const photosValue = fullImagesList.length > 1 ? fullImagesList.join(',') : primaryImg;
      const discountBadge = productForm.badge || productForm.badges?.[0] || (finalDiscountPrice > 0 ? 'বিশেষ অফার' : null);
      const shortDesc = (productForm.key_highlights && productForm.key_highlights.length > 0)
        ? productForm.key_highlights.join(' • ')
        : ((productForm.descriptionBn || '').slice(0, 150) || 'খাঁটি ও প্রাকৃতিক পাহাড়ি পণ্য');
      const fullDesc = productForm.descriptionBn.trim() || 
        [productForm.how_it_is_produced?.trim(), productForm.materials_and_ingredients?.trim(), productForm.usage_and_storage?.trim()].filter(Boolean).join('\n\n') || 
        productForm.descriptionEn?.trim() || 
        'পণ্যের বিস্তারিত বিবরণ';
      const categoryVal = productForm.categoryLabelBn || getCategoryLabel(productForm.category) || productForm.category;
      const qualityVal = productForm.quality_standard.trim() || '১০০% বিশুদ্ধ ও পরীক্ষিত';
      const originVal = productForm.origin.trim() || 'পার্বত্য চট্টগ্রাম';
      const stockStatusVal = (Number(productForm.stock_quantity) || 0) > 0 ? 'in_stock' : 'out_of_stock';
      const sellerNameVal = productForm.seller_info.trim() || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক';
      const reviewsVal = (editingProduct as any)?.product_reviews || [];

      // Determine or reuse database ID to guarantee idempotency and no duplicates
      let targetDbId = editingProduct?.id;
      if (!targetDbId) {
        // Check if a product with the same SKU already exists in Supabase to avoid duplicate rows
        try {
          const { data: existingBySku } = await supabase
            .from('products')
            .select('id')
            .eq('sku', finalSku)
            .maybeSingle();
          if (existingBySku?.id) {
            targetDbId = existingBySku.id;
          }
        } catch (skuLookupErr) {
          console.warn('[AdminProductsTab] SKU check note:', skuLookupErr);
        }
      }

      if (!targetDbId) {
        targetDbId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod_${Date.now()}`;
      }

      // SAFE PRODUCT INSERTION (FALLBACK TO ESSENTIAL FIELDS)
      const safeProductPayload = {
        title: productForm.nameBn?.trim() || productForm.title_bn?.trim() || productForm.title?.trim() || 'নতুন পণ্য',
        price: Number(productForm.price) || 0,
        category: productForm.categoryLabelBn || productForm.category || 'সাধারণ',
        image_url: photosValue || primaryImg || '',
        description: fullDesc || productForm.descriptionBn?.trim() || '',
        stock: Number(productForm.stock_quantity) || 10
      };

      let syncError: string | null = null;

      // Wrap the supabase.from('products').insert() inside a try-catch block and show an explicit alert() if an error occurs
      try {
        if (!isExisting) {
          const { data: insData, error: insErr } = await supabase
            .from('products')
            .insert([safeProductPayload])
            .select();

          if (insErr) {
            console.error('[AdminProductsTab] Supabase products insert error:', insErr);
            alert(`পণ্য সংরক্ষণে সমস্যা: ${insErr.message || JSON.stringify(insErr)}`);
            syncError = insErr.message;
          } else if (insData && insData[0]?.id) {
            targetDbId = String(insData[0].id);
          }
        } else {
          const { error: updErr } = await supabase
            .from('products')
            .update(safeProductPayload)
            .eq('id', targetDbId);

          if (updErr) {
            console.warn('[AdminProductsTab] Supabase products update note:', updErr.message);
            // Fallback insert if not found in table
            const { data: insData, error: insErr } = await supabase
              .from('products')
              .insert([safeProductPayload])
              .select();
            if (insErr) {
              alert(`পণ্য সংরক্ষণে সমস্যা: ${insErr.message || JSON.stringify(insErr)}`);
              syncError = insErr.message;
            } else if (insData && insData[0]?.id) {
              targetDbId = String(insData[0].id);
            }
          }
        }
      } catch (insertEx: any) {
        console.error('[AdminProductsTab] Supabase products insert exception:', insertEx);
        alert(`পণ্য সংরক্ষণে ত্রুটি: ${insertEx?.message || insertEx}`);
        syncError = insertEx?.message;
      }

      // Synchronize to DataContext and UI catalog
      const payload: Partial<StoreProduct> = {
        id: targetDbId,
        code: productForm.code,
        sku: finalSku,
        nameBn: finalTitleBn,
        nameEn: finalTitleEn,
        title_bn: finalTitleBn,
        title_en: finalTitleEn,
        category: productForm.category,
        categoryLabelBn: productForm.categoryLabelBn,
        price: finalPrice,
        discount_price: finalDiscountPrice > 0 ? finalDiscountPrice : undefined,
        discountPrice: finalDiscountPrice > 0 ? finalDiscountPrice : undefined,
        originalPrice: Number(productForm.originalPrice) || finalPrice,
        unit: finalUnit,
        unit_pack: finalUnit,
        stock: Number(productForm.stock_quantity) || 0,
        stock_quantity: Number(productForm.stock_quantity) || 0,
        origin: originVal,
        productionOrigin: originVal,
        production_origin: originVal,
        quality_standard: qualityVal,
        qualityStandards: qualityVal,
        seller_info: sellerNameVal,
        badges: productForm.badges,
        badge: discountBadge || undefined,
        badgeColor: productForm.badgeColor,
        key_highlights: productForm.key_highlights,
        features: productForm.key_highlights,
        how_it_is_produced: productForm.how_it_is_produced.trim(),
        materials_and_ingredients: productForm.materials_and_ingredients.trim(),
        usage_and_storage: productForm.usage_and_storage.trim(),
        videoUrl: productForm.videoUrl.trim(),
        image: primaryImg,
        images: fullImagesList,
        description: fullDesc,
        descriptionBn: productForm.descriptionBn.trim(),
        descriptionEn: productForm.descriptionEn.trim(),
        isPublished: true,
        rating: editingProduct ? editingProduct.rating : 5.0,
        reviewsCount: editingProduct ? editingProduct.reviewsCount : 1
      };

      if (editingProduct && editingProduct.id) {
        await updateProduct(editingProduct.id, payload);
      } else {
        // Prevent duplicate addition if already in context with same ID or SKU
        const existingInContext = products.find(p => p.id === targetDbId || (finalSku && (p.sku === finalSku || p.code === finalSku)));
        if (existingInContext) {
          await updateProduct(existingInContext.id, payload);
        } else {
          addProduct(payload as any);
        }
      }

      if (syncError) {
        onShowToast(`⚠️ পণ্যটি অ্যাপে সিঙ্ক হয়েছে, তবে Supabase নোট: ${syncError}`);
      } else {
        onShowToast(
          editingProduct
            ? `✅ [SKU: ${finalSku}] পণ্যটি সফলভাবে Supabase products টেবিলে আপডেট ও লাইভ সিঙ্ক সম্পন্ন হয়েছে!`
            : `✅ [SKU: ${finalSku}] নতুন পণ্য সফলভাবে Supabase products টেবিলে সংরক্ষিত ও লাইভ সিঙ্ক সম্পন্ন হয়েছে!`
        );
      }

      setIsCreating(false);
      setEditingProduct(null);
      setActiveDraftPreview(null);
    } catch (saveException: any) {
      console.error('[AdminProductsTab] Save exception:', saveException);
      onShowToast(`❌ Supabase সংরক্ষণ ত্রুটি: ${saveException?.message || 'পণ্য সংরক্ষণ করা সম্ভব হয়নি'}`);
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  const filteredProducts = sortProductsAscending(products.filter(p => {
    const matchesSearch = 
      p.nameBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      selectedCategoryFilter === 'all' || 
      p.category === selectedCategoryFilter ||
      p.categoryLabelBn === selectedCategoryFilter ||
      (p.categoryLabelBn && selectedCategoryFilter && p.categoryLabelBn.includes(selectedCategoryFilter));

    return matchesSearch && matchesCategory;
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              সেন্ট্রাল প্রোডাক্ট ও স্টক ম্যানেজমেন্ট
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              মোট {products.length}টি পণ্য
            </span>
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
              স্বয়ংক্রিয় প্রোডাক্ট কোড সিস্টেম সক্রিয়
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            খাবার, প্রসাধনী, পাহাড়ি অর্গানিক পণ্য, ইলেকট্রনিক্স ও ফ্যাশন সামগ্রী পরিচালনা করুন। কম্পিউটার থেকে সরাসরি ছবি আপলোড এবং অটো-জেনারেটেড কোড সুবিধা সম্পন্ন।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDirectUploadModal(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-700/20 transition cursor-pointer"
            title="কম্পিউটার থেকে সরাসরি Supabase Storage-এ পণ্য আপলোড করুন"
          >
            <UploadCloud className="w-4 h-4" />
            <span>সরাসরি স্টোরেজ আপলোড</span>
          </button>

          {!isCreating ? (
            <button
              onClick={() => startNewProduct()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন পণ্য যোগ করুন</span>
            </button>
          ) : (
            <button
              onClick={cancelForm}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>ক্যাটালগে ফিরুন</span>
            </button>
          )}
        </div>
      </div>

      {/* DIRECT SUPABASE STORAGE UPLOAD MODAL */}
      {showDirectUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                সরাসরি Supabase Storage প্রোডাক্ট আপলোডার
              </h2>
              <button
                type="button"
                onClick={() => setShowDirectUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminUploadForm
              mode="product"
              onUploadSuccess={(url) => {
                onShowToast('✅ স্থায়ী Supabase URL তৈরি হয়েছে এবং ডাটাবেসে সেভ হয়েছে!');
                setShowDirectUploadModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT FORM */}
      {isCreating && (
        <form onSubmit={handleSaveProduct} className="bg-white p-6 sm:p-7 rounded-2xl border-2 border-emerald-500 shadow-xl space-y-6 animate-fadeIn">
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  {editingProduct ? 'পণ্য তথ্য এডিট প্যানেল' : 'নতুন পণ্য যুক্ত করুন'}
                </h2>
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  কোড: {productForm.code}
                </span>
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  SKU: {productForm.sku || `JDM-${productForm.code}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                মৌলিক তথ্য, আকর্ষণীয় পয়েন্ট, বিস্তারিত বিবরণ ও স্পেসিফিকেশন পূরণ করুন। লাইভ প্রিভিউতে সাথে সাথে পরিবর্তন দেখতে পাবেন।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const draft = getCurrentDraftProduct();
                  if (onPreviewProduct) {
                    onPreviewProduct(draft);
                  }
                  onShowToast('👁️ কাস্টমার ভিউতে লাইভ ড্রাফট প্রিভিউ খোলা হয়েছে!');
                }}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="কাস্টমার যেভাবে দেখবে সেই প্রিভিউ দেখুন"
              >
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>লাইভ প্রিভিউ</span>
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Tabs Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 flex-1">
              <button
                type="button"
                onClick={() => setActiveFormTab('basic')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeFormTab === 'basic'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">১. মৌলিক তথ্য</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('media')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeFormTab === 'media'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">২. ছবি ও ভিডিও</span>
                {productForm.images.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                    {productForm.images.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('highlights')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeFormTab === 'highlights'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ListPlus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">৩. বিশেষ আকর্ষণ</span>
                {productForm.key_highlights.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                    {productForm.key_highlights.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('specs')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeFormTab === 'specs'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">৪. স্পেসিফিকেশন</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('overview')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeFormTab === 'overview'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">৫. বিস্তারিত বিবরণ</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveFormTab(activeFormTab === 'all' ? 'basic' : 'all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 border cursor-pointer ${
                activeFormTab === 'all'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-slate-100/80 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="সবগুলো কার্ড একসাথে দেখুন"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>{activeFormTab === 'all' ? 'ট্যাব মোড' : 'সবগুলো কার্ড'}</span>
            </button>
          </div>

          {/* TAB 1 / CARD 1: মৌলিক তথ্য (Basic Info) */}
          {(activeFormTab === 'basic' || activeFormTab === 'all') && (
            <div className="space-y-5 animate-fadeIn bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              {activeFormTab === 'all' && (
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    ১
                  </div>
                  <span>১. মৌলিক তথ্য, মূল্য ও ব্যাজসমূহ (Basic Information)</span>
                </div>
              )}
              {/* Product Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    পণ্যের নাম (বাংলা) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.title_bn || productForm.nameBn}
                    onChange={e => setProductForm({ ...productForm, title_bn: e.target.value, nameBn: e.target.value })}
                    placeholder="যেমন: খাঁটি পাহাড়ি জুমের মধু / পাহাড়ি কাঁচা হলুদ গুঁড়া"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Product Name (English)
                  </label>
                  <input
                    type="text"
                    value={productForm.title_en || productForm.nameEn}
                    onChange={e => setProductForm({ ...productForm, title_en: e.target.value, nameEn: e.target.value })}
                    placeholder="e.g. Pure Hill Forest Honey / Organic Wild Turmeric"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Category, SKU and Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ক্যাটাগরি নির্বাচন <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      PRODUCT_CATEGORIES.find(
                        c => c.value === productForm.category || c.labelBn === productForm.category || c.labelBn === productForm.categoryLabelBn
                      )?.value || productForm.category
                    }
                    onChange={e => {
                      const cat = e.target.value;
                      const label = getCategoryLabel(cat);
                      setProductForm({ 
                        ...productForm, 
                        category: cat, 
                        categoryLabelBn: label,
                        unit_pack: cat === 'RealEstate' ? '১ শতক / ডেসিমাল' : productForm.unit_pack
                      });
                    }}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 shadow-2xs cursor-pointer"
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.labelBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      প্রোডাক্ট কোড / SKU
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = generateNextProductCode(products);
                        setProductForm({
                          ...productForm,
                          code: next,
                          sku: `JDM-${next}`
                        });
                        onShowToast('⚡ নতুন কোড ও SKU তৈরি করা হয়েছে!');
                      }}
                      className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                    >
                      অটো জেনারেট
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="e.g. JDM-001"
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800 shadow-2xs"
                    />
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-3 rounded-xl border border-slate-200 whitespace-nowrap">
                      #{productForm.code}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    মজুদ স্টক সংখ্যা (Stock Quantity) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock_quantity}
                    onChange={e => {
                      const qty = Math.max(0, parseInt(e.target.value) || 0);
                      setProductForm({ ...productForm, stock_quantity: qty });
                    }}
                    placeholder="যেমন: ৫০"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Price, Discount Price, Original Price, Unit Pack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    বিক্রয় মূল্য (৳ Price) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={productForm.price === 0 ? '' : productForm.price}
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                        setProductForm({ 
                          ...productForm, 
                          price: val
                        });
                      }}
                      placeholder="০.০০"
                      className="w-full text-xs p-3 pl-8 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-slate-900 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    অফার / ডিসকাউন্ট মূল্য (৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={productForm.discount_price === 0 ? '' : productForm.discount_price}
                      onChange={e => setProductForm({ ...productForm, discount_price: e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="ঐচ্ছিক (যেমন: ৪৫০)"
                      className="w-full text-xs p-3 pl-8 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-700 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    পূর্বের নিয়মিত মূল্য (৳ Original Price)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={productForm.originalPrice === 0 ? '' : productForm.originalPrice}
                      onChange={e => setProductForm({ ...productForm, originalPrice: e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="ঐচ্ছিক (যেমন: ৫৫০)"
                      className="w-full text-xs p-3 pl-8 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    একক / প্যাকিং সাইজ (Unit Pack) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.unit_pack}
                    onChange={e => setProductForm({ ...productForm, unit_pack: e.target.value })}
                    placeholder="যেমন: ৫০০ গ্রাম, ১ কেজি, ১ পিস"
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              {/* Production Origin */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  উৎপাদন স্থল (Production Origin) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productForm.origin}
                  onChange={e => setProductForm({ ...productForm, origin: e.target.value })}
                  placeholder="যেমন: ঘরে তৈরি (Homemade) / খাগড়াছড়ি, পার্বত্য চট্টগ্রাম"
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-2xs"
                />
              </div>

              {/* Dynamic Badges Manager */}
              <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    পণ্যের ব্যাজসমূহ (Badges & Trust Tags)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    কাস্টমাররা কার্ডের উপর এই ব্যাজগুলো দেখতে পাবেন
                  </span>
                </div>

                {/* Preset badges clickable toggles */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium mr-1">প্রিসেট ট্যাগ:</span>
                  {PRESET_BADGES.map((badgeText) => {
                    const isSelected = productForm.badges.includes(badgeText);
                    return (
                      <button
                        key={badgeText}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setProductForm({
                              ...productForm,
                              badges: productForm.badges.filter(b => b !== badgeText)
                            });
                          } else {
                            setProductForm({
                              ...productForm,
                              badges: [...productForm.badges, badgeText]
                            });
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {badgeText}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Badge Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={customBadgeInput}
                    onChange={e => setCustomBadgeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customBadgeInput.trim() && !productForm.badges.includes(customBadgeInput.trim())) {
                          setProductForm({
                            ...productForm,
                            badges: [...productForm.badges, customBadgeInput.trim()]
                          });
                          setCustomBadgeInput('');
                        }
                      }
                    }}
                    placeholder="কাস্টম নতুন ব্যাজ লিখুন (যেমন: প্রিমিয়াম গোল্ড কোয়ালিটি)..."
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customBadgeInput.trim() && !productForm.badges.includes(customBadgeInput.trim())) {
                        setProductForm({
                          ...productForm,
                          badges: [...productForm.badges, customBadgeInput.trim()]
                        });
                        setCustomBadgeInput('');
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + ব্যাজ যোগ
                  </button>
                </div>

                {/* Active Badges List */}
                {productForm.badges.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] text-slate-500 font-medium">নির্বাচিত ব্যাজ ({productForm.badges.length}টি):</span>
                    {productForm.badges.map((b, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-800 border border-emerald-300/80 text-xs font-bold px-2.5 py-1 rounded-lg"
                      >
                        <span>{b}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm({
                              ...productForm,
                              badges: productForm.badges.filter((_, i) => i !== idx)
                            });
                          }}
                          className="hover:text-red-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2 / CARD 2: ছবি ও ভিডিও (Supabase Database Images & Video) */}
          {(activeFormTab === 'media' || activeFormTab === 'all') && (
            <div className="space-y-5 animate-fadeIn bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              {activeFormTab === 'all' && (
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    ২
                  </div>
                  <span>২. ছবি ও ভিডিও (Supabase Database Images & Video Link)</span>
                </div>
              )}

              {/* Form Fields Section 2: SUPABASE DATABASE & CLOUD STORAGE IMAGE MANAGEMENT */}
              <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Supabase ডাটাবেজ ও ক্লাউড স্টোরেজ থেকে ছবি (Supabase Database Images)</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300/60 flex items-center gap-1">
                        <CloudLightning className="w-3 h-3 text-emerald-600" />
                        {isSupabaseConfigured ? 'Supabase Live Connected' : 'Supabase Ready'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      কম্পিউটারের লোকাল ফাইল ম্যানেজারের পরিবর্তে সরাসরি Supabase ডাটাবেজ ও ক্লাউড স্টোরেজের সংরক্ষিত ইমেজ লাইব্রেরি থেকে ছবি নির্বাচন করুন অথবা ক্লাউডে নতুন ছবি আপলোড করুন।
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>কম্পিউটার থেকে ছবি আপলোড</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSupabasePickerOpen(true)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Database className="w-3.5 h-3.5 text-emerald-300" />
                      <span>ইমেজ লাইব্রেরি</span>
                    </button>
                    {productForm.images.length > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                        {productForm.images.length}টি ছবি নির্বাচিত
                      </span>
                    )}
                  </div>
                </div>

                {/* Hidden native multiple file input for direct fallback */}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files) {
                      handleFilesSelected(e.target.files);
                    }
                  }}
                />

                {/* Supabase Storage Upload / Computer File Drop Zone */}
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={e => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) {
                      handleFilesSelected(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition flex flex-col items-center justify-center group
                    ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-300/80 bg-white hover:border-emerald-500 hover:bg-emerald-50/20'}
                  `}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2.5 group-hover:scale-110 transition shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    {isUploadingImages ? 'Supabase ক্লাউড স্টোরেজে আপলোড হচ্ছে...' : 'কম্পিউটার থেকে ছবি নির্বাচন করতে এখানে ক্লিক করুন অথবা ড্রপ করুন'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-lg">
                    কম্পিউটার থেকে ছবি সিলেক্ট করলেই তা সরাসরি Supabase Storage এর <span className="font-mono font-bold text-emerald-700">products</span> বাক্সে পার্মানেন্টলি আপলোড হয়ে যাবে।
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-[10px]">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      Supabase Storage Direct
                    </span>
                    <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">PNG, JPG, WebP</span>
                    <span className="bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded border border-teal-200/60">স্থায়ী Public URL</span>
                  </div>
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Uploaded/Selected Images Thumbnails Grid */}
                {productForm.images.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-emerald-600" />
                        Supabase থেকে যুক্তকৃত ছবিসমূহ ({productForm.images.length}টি):
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSupabasePickerOpen(true)}
                        className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Supabase থেকে আরো ছবি যোগ করুন</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {productForm.images.map((imgUrl, idx) => {
                        const isCover = imgUrl === productForm.image || (idx === 0 && !productForm.image);
                        const isSupabaseUrl = imgUrl.includes('supabase.co') || imgUrl.includes('storage/v1');
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-xl overflow-hidden border-2 bg-white shadow-2xs group flex flex-col ${isCover ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'}`}
                          >
                            <div className="relative aspect-square bg-slate-100">
                              <img
                                src={getProductPublicUrl(imgUrl)}
                                alt={`Product Upload ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = NO_IMAGE_AVAILABLE_ICON;
                                }}
                              />
                              {isCover && (
                                <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> কভার
                                </span>
                              )}
                              {isSupabaseUrl && !isCover && (
                                <span className="absolute top-1 left-1 bg-slate-900/80 text-emerald-300 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 backdrop-blur-xs">
                                  <Database className="w-2 h-2 text-emerald-400" /> Supabase
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(idx);
                                }}
                                className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md opacity-90 hover:opacity-100 transition shadow-xs cursor-pointer"
                                title="ছবিটি মুছুন"
                              >
                                <Trash className="w-3 h-3" />
                              </button>
                            </div>

                            {!isCover && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCoverImage(imgUrl);
                                }}
                                className="w-full text-[10px] font-bold py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-t border-slate-200 transition cursor-pointer"
                              >
                                কভার ছবি করুন
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Video Link & Live Embed Preview */}
              <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-600" />
                    <span>পণ্যের ভিডিও লিংক (YouTube Video URL - ঐচ্ছিক)</span>
                  </label>
                  {productForm.videoUrl && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      ভিডিও সংযুক্ত
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  পণ্য প্রস্তুতকরণ, কার্যকারিতা বা আনবক্সিং ভিডিও লিংক দিন। ইউটিউব ভিডিও লিংক সরাসরি প্রডাক্ট ডিটেইলস পেজে এম্বেড হবে।
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={productForm.videoUrl}
                    onChange={e => setProductForm({ ...productForm, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... অথবা https://youtu.be/..."
                    className="flex-1 text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-2xs"
                  />
                  {productForm.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, videoUrl: '' })}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition border border-rose-200 cursor-pointer"
                      title="ভিডিও লিংক মুছুন"
                    >
                      মুছুন
                    </button>
                  )}
                </div>

                {/* Live YouTube Video Embed Preview */}
                {productForm.videoUrl && getYouTubeEmbedUrl(productForm.videoUrl) ? (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-rose-600" />
                      লাইভ ভিডিও প্রিভিউ:
                    </span>
                    <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-black">
                      <iframe
                        src={getYouTubeEmbedUrl(productForm.videoUrl)!}
                        title="Product Video Preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : productForm.videoUrl ? (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    সঠিক ইউটিউব ভিডিও লিংক প্রদান করুন (যেমন: https://www.youtube.com/watch?v=... বা https://youtu.be/...)
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {/* TAB 3 / CARD 3: বিশেষ আকর্ষণ ও উপকারিতা (Key Highlights) */}
          {(activeFormTab === 'highlights' || activeFormTab === 'all') && (
            <div className="space-y-5 animate-fadeIn bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              {activeFormTab === 'all' && (
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    ৩
                  </div>
                  <span>৩. বিশেষ আকর্ষণ ও পয়েন্টসমূহ (Key Highlights)</span>
                </div>
              )}
              <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
                <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  পণ্যের বিশেষ আকর্ষণ ও বুলেট পয়েন্টসমূহ (Key Highlights)
                </h3>
                <p className="text-[11px] text-emerald-700 mt-1">
                  এখানে যোগ করা বুলেট পয়েন্টগুলো কাস্টমার প্রোডাক্ট পেজে “বিশেষ আকর্ষণ ও উপকারিতা” ট্যাবে প্রদর্শিত হবে।
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">দ্রুত পয়েন্ট যোগ করুন (ক্লিক করুন):</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_HIGHLIGHTS.map((ph, idx) => {
                    const isAdded = productForm.key_highlights.includes(ph);
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAdded}
                        onClick={() => {
                          if (!isAdded) {
                            setProductForm({
                              ...productForm,
                              key_highlights: [...productForm.key_highlights, ph]
                            });
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border text-left transition cursor-pointer ${
                          isAdded
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300 shadow-2xs'
                        }`}
                      >
                        {isAdded ? '✓ যুক্ত হয়েছে' : `+ ${ph}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Add Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  নতুন পয়েন্ট লিখুন
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customHighlightInput}
                    onChange={e => setCustomHighlightInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customHighlightInput.trim()) {
                          setProductForm({
                            ...productForm,
                            key_highlights: [...productForm.key_highlights, customHighlightInput.trim()]
                          });
                          setCustomHighlightInput('');
                        }
                      }
                    }}
                    placeholder="যেমন: খাগড়াছড়ির জুমের খেত থেকে সরাসরি সংগৃহীত..."
                    className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customHighlightInput.trim()) {
                        setProductForm({
                          ...productForm,
                          key_highlights: [...productForm.key_highlights, customHighlightInput.trim()]
                        });
                        setCustomHighlightInput('');
                      }
                    }}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>পয়েন্ট যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Current Highlights List */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>বর্তমান আকর্ষণ পয়েন্ট তালিকা ({productForm.key_highlights.length}টি)</span>
                  {productForm.key_highlights.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, key_highlights: [] })}
                      className="text-[11px] text-red-600 hover:underline font-bold"
                    >
                      সব মুছুন
                    </button>
                  )}
                </label>

                {productForm.key_highlights.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    কোনো পয়েন্ট যোগ করা হয়নি। উপরের প্রিসেট থেকে ক্লিক করুন অথবা নিজে পয়েন্ট লিখুন।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productForm.key_highlights.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-emerald-300 transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-xs text-slate-800 font-medium leading-relaxed">
                            {item}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm({
                              ...productForm,
                              key_highlights: productForm.key_highlights.filter((_, i) => i !== index)
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4 / CARD 4: পণ্য স্পেসিফিকেশন (Product Specifications) */}
          {(activeFormTab === 'specs' || activeFormTab === 'all') && (
            <div className="space-y-5 animate-fadeIn bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              {activeFormTab === 'all' && (
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    ৪
                  </div>
                  <span>৪. পণ্যের স্পেসিফিকেশন ও তথ্য (Specifications)</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Origin */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    উৎপত্তি / উৎপাদন স্থল (Origin) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.origin}
                    onChange={e => setProductForm({ ...productForm, origin: e.target.value })}
                    placeholder="যেমন: ঘরে তৈরি (Homemade) / খাগড়াছড়ি, পার্বত্য চট্টগ্রাম"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-2xs"
                  />
                </div>

                {/* Quality Standard */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    গুণগত মান ও বিশুদ্ধতার মানদণ্ড (Quality Standard) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.quality_standard}
                    onChange={e => setProductForm({ ...productForm, quality_standard: e.target.value })}
                    placeholder="যেমন: ১০০% বিশুদ্ধ ও পরীক্ষিত / কোনো কেমিক্যাল নেই"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seller Info */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    সরবরাহকারী বা বিক্রেতার তথ্য (Seller Info) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.seller_info}
                    onChange={e => setProductForm({ ...productForm, seller_info: e.target.value })}
                    placeholder="যেমন: ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-2xs"
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-600" />
                    পণ্যের ভিডিও লিংক (YouTube URL - ঐচ্ছিক)
                  </label>
                  <input
                    type="url"
                    value={productForm.videoUrl}
                    onChange={e => setProductForm({ ...productForm, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Live Preview Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  স্পেসিফিকেশন সারাংশ যাচাই:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">উৎপত্তি:</span>
                    <strong className="text-slate-800">{productForm.origin || 'উল্লেখ নেই'}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">কোয়ালিটি মান:</span>
                    <strong className="text-emerald-700">{productForm.quality_standard || 'উল্লেখ নেই'}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">বিক্রেতা:</span>
                    <strong className="text-slate-800">{productForm.seller_info || 'উল্লেখ নেই'}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">ভিডিও সংযুক্ত:</span>
                    <strong className="text-slate-800">{productForm.videoUrl ? 'হ্যাঁ' : 'নেই'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5 / CARD 5: পণ্যের বিস্তারিত বিবরণ (Product Overview) */}
          {(activeFormTab === 'overview' || activeFormTab === 'all') && (
            <div className="space-y-5 animate-fadeIn bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              {activeFormTab === 'all' && (
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    ৫
                  </div>
                  <span>৫. বিস্তারিত বিবরণ, উপাদান ও সংরক্ষণ বিধি (Overview & Usage)</span>
                </div>
              )}
              {/* Main Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  পণ্যের মূল পরিচিতি ও বিস্তারিত বিবরণ (Description - বাংলা) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={productForm.descriptionBn}
                  onChange={e => setProductForm({ ...productForm, descriptionBn: e.target.value })}
                  placeholder="পণ্যের পূর্ণাঙ্গ পরিচিতি, গুণাগুণ ও বৈশিষ্ট্য বিস্তারিত লিখুন..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Product Overview (English)
                </label>
                <textarea
                  rows={2}
                  value={productForm.descriptionEn}
                  onChange={e => setProductForm({ ...productForm, descriptionEn: e.target.value })}
                  placeholder="Detailed product overview in English..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium shadow-2xs"
                />
              </div>

              {/* How it is produced */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  উৎপাদন ও সংগ্রহ প্রণালী (How it is produced)
                </label>
                <textarea
                  rows={3}
                  value={productForm.how_it_is_produced}
                  onChange={e => setProductForm({ ...productForm, how_it_is_produced: e.target.value })}
                  placeholder="যেমন: খাগড়াছড়ির স্থানীয় জুম চাষীদের কাছ থেকে সরাসরি খাঁটি কাঁচামাল সংগ্রহ করে নিজস্ব হাইজিনিক পরিবেশে কাঠের ঘানি / মিলিংয়ের মাধ্যমে প্রক্রিয়াজাত করা হয়..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium shadow-2xs"
                />
              </div>

              {/* Materials & Ingredients */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  উপাদান ও বৈশিষ্ট্য (Materials & Ingredients)
                </label>
                <textarea
                  rows={3}
                  value={productForm.materials_and_ingredients}
                  onChange={e => setProductForm({ ...productForm, materials_and_ingredients: e.target.value })}
                  placeholder="যেমন: ১০০% প্রাকৃতিক উপাদান, কোনো প্রিজারভেটিভ, আর্টিফিশিয়াল ফ্লেভার বা ক্ষতিকর কেমিক্যাল নেই..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium shadow-2xs"
                />
              </div>

              {/* Usage & Storage */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  ব্যবহার ও সংরক্ষণ বিধি (Usage & Storage)
                </label>
                <textarea
                  rows={3}
                  value={productForm.usage_and_storage}
                  onChange={e => setProductForm({ ...productForm, usage_and_storage: e.target.value })}
                  placeholder="যেমন: সরাসরি রোদের আলো থেকে দূরে স্বাভাবিক তাপমাত্রায় শুষ্ক ও পরিষ্কার স্থানে সংরক্ষণ করুন। ব্যবহারের পর পাত্রের মুখ ভালো করে বন্ধ রাখুন..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-slate-100 gap-3">
            <div className="text-xs text-slate-500">
              কোড: <strong className="text-slate-800 font-mono">{productForm.code}</strong> • 
              SKU: <strong className="text-slate-800 font-mono">{productForm.sku || `JDM-${productForm.code}`}</strong> • 
              ক্যাটাগরি: <strong className="text-slate-800">{productForm.categoryLabelBn}</strong>
            </div>

            <div className="flex items-center justify-end gap-2 flex-wrap">
              {activeFormTab !== 'basic' && activeFormTab !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeFormTab === 'overview') setActiveFormTab('specs');
                    else if (activeFormTab === 'specs') setActiveFormTab('highlights');
                    else if (activeFormTab === 'highlights') setActiveFormTab('media');
                    else if (activeFormTab === 'media') setActiveFormTab('basic');
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>আগের ধাপ</span>
                </button>
              )}

              {activeFormTab !== 'overview' && activeFormTab !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeFormTab === 'basic') setActiveFormTab('media');
                    else if (activeFormTab === 'media') setActiveFormTab('highlights');
                    else if (activeFormTab === 'highlights') setActiveFormTab('specs');
                    else if (activeFormTab === 'specs') setActiveFormTab('overview');
                  }}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>পরবর্তী ধাপ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল
              </button>

              <button
                type="submit"
                id="btn-add-product-live-sync"
                disabled={isUploadingImages || isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-700/25 transition cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>
                  {isSaving 
                    ? 'Supabase-এ সেভ ও লাইভ সিঙ্ক হচ্ছে...' 
                    : (editingProduct ? 'আপডেট সেভ ও লাইভ সিঙ্ক করুন' : 'পণ্য যোগ ও লাইভ সিঙ্ক (Add Product & Live Sync)')}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="পণ্যের নাম বা কোড দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            প্রদর্শিত হচ্ছে: <strong className="text-slate-800">{filteredProducts.length}</strong>টি পণ্য
          </div>
        </div>

        {/* Categories Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${selectedCategoryFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            সব পণ্য ({products.length})
          </button>
          {PRODUCT_CATEGORIES.map(cat => {
            const isSelected = selectedCategoryFilter === cat.value;
            const count = products.filter(p => p.category === cat.value || p.categoryLabelBn === cat.labelBn || (p.categoryLabelBn && p.categoryLabelBn.includes(cat.labelBn))).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-xl transition shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.labelBn} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-sm">কোনো পণ্য পাওয়া যায়নি</p>
          <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে সার্চ বা ক্যাটাগরি ফিল্টার পরিবর্তন করুন অথবা নতুন পণ্য যোগ করুন।</p>
          <button
            onClick={() => startNewProduct(selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>এই ক্যাটাগরিতে পণ্য যোগ করুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((p, idx) => {
            const productCode = p.code || String(idx + 1).padStart(3, '0');
            const imagesCount = Array.isArray(p.images) && p.images.length > 0 ? p.images.length : 1;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Product Top Image & Badges */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={getProductPublicUrl(p.image)}
                    alt={p.nameBn}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e: any) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = NO_IMAGE_AVAILABLE_ICON;
                    }}
                  />
                  {/* Auto Product Code Badge */}
                  <span className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-sm border border-white/20">
                    #{productCode}
                  </span>

                  {/* Multi-images indicator */}
                  {imagesCount > 1 && (
                    <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" /> {imagesCount}টি ছবি
                    </span>
                  )}

                  {/* Video indicator if available */}
                  {p.videoUrl && (
                    <span className="absolute bottom-2.5 right-2.5 bg-red-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Film className="w-2.5 h-2.5" /> ভিডিও
                    </span>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                    {p.categoryLabelBn || p.category}
                  </div>
                </div>

                {/* Body Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
                      {p.nameBn}
                    </h3>
                    {p.nameEn && (
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                        {p.nameEn}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-base font-black text-emerald-600">
                        ৳{p.price}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ৳{p.originalPrice}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-medium">
                        / {p.unit || 'পিস'}
                      </span>
                    </div>

                    {p.qualityStandards && (
                      <p className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded-md mt-2 line-clamp-1 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        <span>{p.qualityStandards}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>স্টক: <strong className="text-slate-800">{p.stock}</strong></span>
                    <span className="truncate max-w-[140px]" title={p.productionOrigin || p.origin}>
                      উৎস: <strong>{p.productionOrigin || p.origin || 'ঘরে তৈরি'}</strong>
                    </span>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleProductPublishStatus(p.id)}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${p.isPublished !== false ? 'text-emerald-700 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-200'}`}
                    title={p.isPublished !== false ? 'পাবলিশ সক্রিয়' : 'পাবলিশ নিষ্ক্রিয়'}
                  >
                    {p.isPublished !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{p.isPublished !== false ? 'লাইভ' : 'ড্রাফট'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditProduct(p)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="পণ্য এডিট করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>এডিট</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`আপনি কি "${p.nameBn}" পণ্যটি মুছে ফেলতে চান?`)) {
                          await resilientSupabaseDelete('products', {
                            id: p.id,
                            sku: p.sku || p.code,
                            title: p.nameBn || p.title_bn,
                            image_url: p.image
                          });
                          await deleteProduct(p.id);
                          onShowToast('🗑️ পণ্যটি সফলভাবে মুছে ফেলা হয়েছে!');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="পণ্য মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Supabase Database & Cloud Storage Image Picker Modal */}
      <SupabaseMediaPickerModal
        isOpen={isSupabasePickerOpen}
        onClose={() => setIsSupabasePickerOpen(false)}
        onSelect={handleSupabaseMediaSelected}
        productId={editingProduct?.id}
        initialSelectedUrls={productForm.images}
        allowMultiple={true}
        onShowToast={onShowToast}
      />
    </div>
  );
};
