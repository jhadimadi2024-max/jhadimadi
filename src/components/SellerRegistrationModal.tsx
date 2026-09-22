import React, { useState } from 'react';
import { 
  X, Store, ShoppingBag, ShieldCheck, MapPin, Upload, 
  Camera, CheckCircle2, Phone, Mail, Lock, Eye, EyeOff,
  Sparkles, FileText, Award, Building, User, AlertCircle, Loader2,
  Package, Trash2, Image as ImageIcon, Plus, Check
} from 'lucide-react';
import { Language, District, UserProfile, Product } from '../types';
import { supabase } from '../supabase';
import { databaseService } from '../services/databaseService';
import { sanitizeDatabasePayload } from '../utils/imageUtils';
import { registerUnifiedEntity } from '../services/unifiedRegistrationService';
import { smartSupabaseInsert, prepareSellerPayload, prepareProductSellerPayload } from '../utils/supabaseDataService';

interface SellerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  lang: Language;
  defaultDivision?: string;
  defaultDistrict?: string;
  defaultUpazila?: string;
  defaultMahalla?: string;
}

const BUSINESS_CATEGORIES = [
  { id: 'real_estate', labelBn: 'রিয়েল এস্টেট' },
  { id: 'clothing_dress', labelBn: 'পোশাক-আশাক / ড্রেস' },
  { id: 'food_grocery', labelBn: 'ফুড ও খাবার' },
  { id: 'car_vehicles', labelBn: 'গাড়ি ও যানবাহন' },
  { id: 'professional_services', labelBn: 'পেশাদার সেবা' },
  { id: 'electronics', labelBn: 'ইলেকট্রনিক্স' },
  { id: 'jewelry_ornaments', labelBn: 'গহনা ও অলংকার' },
  { id: 'house_rent', labelBn: 'বাসা ভাড়া' },
  { id: 'tuition_education', labelBn: 'টিউশনি ও শিক্ষা' },
  { id: 'agri_hill', labelBn: 'কৃষি ও পাহাড়ি শিল্প' },
  { id: 'handicrafts', labelBn: 'হস্তশিল্প' },
  { id: 'tour_travel', labelBn: 'ট্যুর ও ট্রাভেলিং' },
  { id: 'hotel_restaurant', labelBn: 'হোটেল ও রেস্টুরেন্ট' },
  { id: 'vet_animal_care', labelBn: 'পশুপাখি চিকিৎসা' },
  { id: 'health_beauty', labelBn: 'স্বাস্থ্য ও রূপচর্চা' },
  { id: 'jobs_recruitment', labelBn: 'চাকরি' },
];

const SELLER_PRODUCT_CATEGORIES = [
  'পাহাড়ি অর্গানিক খাদ্য ও কৃষিপণ্য',
  'প্রাকৃতিক পাহাড়ি মধু',
  'পোশাক ও পাহাড়ি ঐতিহ্যবাহী তাঁতবস্ত্র (থামি/পিনন/হাদি)',
  'বাঁশ, বেত ও কাঠের হস্তশিল্প',
  'পাহাড়ি ফলমূল ও শাকসবজি',
  'ঐতিহ্যবাহী শুঁটকি ও সিদল',
  'পাহাড়ি অর্গানিক মসলা ও ভেষজ উপাদান',
  'চা ও পাহাড়ি কফি',
  'অন্যান্য পাহাড়ি ঐতিহ্যবাহী পণ্য সামগ্রী',
];

/* =========================================================
   PHONE & NID NORMALIZATION HELPERS
========================================================= */

const normalizeBangladeshPhone = (value: string): string => {
  let phone = value.trim().replace(/[\s\-()]/g, '');
  if (phone.startsWith('+880')) {
    phone = '0' + phone.substring(4);
  } else if (phone.startsWith('880')) {
    phone = '0' + phone.substring(3);
  }
  return phone;
};

const isValidBangladeshPhone = (phone: string): boolean => {
  return /^01[3-9]\d{8}$/.test(phone);
};

const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

const normalizeNID = (nid: string): string => {
  return nid.trim().replace(/\s+/g, '');
};

const DUPLICATE_MESSAGE = 'আপনার এই মোবাইল নম্বর, ই-মেইল অথবা এনআইডি দিয়ে ইতিমধ্যে একটি বিক্রেতা অ্যাকাউন্ট নিবন্ধিত হয়েছে। অনুগ্রহ করে অন্য তথ্য ব্যবহার করুন।';

export const SellerRegistrationModal: React.FC<SellerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
  defaultDivision = 'Chittagong Division (চট্টগ্রাম)',
  defaultDistrict = 'Rangamati',
  defaultUpazila = 'Rangamati Sadar',
  defaultMahalla = 'বনরুপা (Bonorupa)',
}) => {
  const [productNameOrBusiness, setProductNameOrBusiness] = useState('');
  const shopName = productNameOrBusiness;
  const ownerName = productNameOrBusiness;
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessCategory, setBusinessCategory] = useState('food_grocery');
  const [tradeLicenseOrNid, setTradeLicenseOrNid] = useState('');
  const [shopAddress, setShopAddress] = useState('বনরুপা বাজার, মেইন রোড');
  const [division, setDivision] = useState(defaultDivision);
  const [district, setDistrict] = useState(defaultDistrict);
  const [upazila, setUpazila] = useState(defaultUpazila);
  const [mahalla, setMahalla] = useState(defaultMahalla);
  const [shopBannerUrl, setShopBannerUrl] = useState('');

  // Product Details & Images State
  const [productName, setProductName] = useState('');
  const [productItemCategory, setProductItemCategory] = useState(SELLER_PRODUCT_CATEGORIES[0]);
  const [productPrice, setProductPrice] = useState('650');
  const [productUnit, setProductUnit] = useState('১ কেজি');
  const [productDescription, setProductDescription] = useState('');
  const [productImages, setProductImages] = useState<Array<{ url: string; name: string }>>([]);
  const [productImageUrlInput, setProductImageUrlInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProductImages((prev) => [...prev, { url: reader.result as string, name: file.name }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!productImageUrlInput.trim()) return;
    setProductImages((prev) => [...prev, { url: productImageUrlInput.trim(), name: 'Web Image' }]);
    setProductImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!productNameOrBusiness.trim() && !productName.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে পণ্যের নাম বা ব্যবসার নাম লিখুন।' : 'Please enter Product Name or Business Name.');
      return;
    }

    if (!productDescription.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে পণ্যের বিস্তারিত বিবরণ ও বৈশিষ্ট্য লিখুন।' : 'Please enter detailed product description.');
      return;
    }

    const cleanPhone = normalizeBangladeshPhone(phone);
    if (!isValidBangladeshPhone(cleanPhone)) {
      setErrorMsg(lang === 'bn' ? 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।' : 'Please provide a valid 11-digit mobile number.');
      return;
    }

    const cleanEmail = email.trim() ? normalizeEmail(email) : '';
    const cleanNid = tradeLicenseOrNid.trim() ? normalizeNID(tradeLicenseOrNid) : '';

    setIsSubmitting(true);

    try {
      /* ===================================================
         DUPLICATE CHECK ACROSS PRODUCT SELLERS
      =================================================== */
      let duplicateQuery = supabase
        .from('product_sellers')
        .select('phone, phone_number')
        .or(`phone.eq.${cleanPhone},phone_number.eq.${cleanPhone}`);

      const { data: existingSellers, error: duplicateCheckError } = await duplicateQuery;

      if (duplicateCheckError) {
        console.error('Duplicate check warning:', duplicateCheckError);
      }

      if (existingSellers && existingSellers.length > 0) {
        setIsSubmitting(false);
        setErrorMsg('এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।');
        return;
      }

      const uploadedPhotosList = productImages.map(img => img.url);
      const finalProductPhoto = uploadedPhotosList[0] || shopBannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&auto=format&fit=crop&q=80';

      const unifiedResult = await registerUnifiedEntity({
        role: 'seller',
        fullName: productNameOrBusiness.trim() || productName.trim(),
        phone: cleanPhone,
        email: cleanEmail || undefined,
        password: password,
        division,
        district,
        upazila,
        area: mahalla || `${upazila} এলাকা`,
        avatarUrl: finalProductPhoto || shopBannerUrl || '',
        rolePayload: {
          shopName: productNameOrBusiness.trim() || productName.trim(),
          ownerName: productNameOrBusiness.trim() || productName.trim(),
          businessName: productNameOrBusiness.trim() || productName.trim(),
          productName: productName.trim() || productNameOrBusiness.trim(),
          productNameOrBusiness: productNameOrBusiness.trim() || productName.trim(),
          businessCategory,
          tradeLicenseOrNid: cleanNid,
          productDesc: productDescription.trim() || `${productNameOrBusiness.trim()}-এর পাহাড়ি পণ্য সামগ্রী`,
          category: productItemCategory || businessCategory,
          price: parseFloat(productPrice) || 650,
          unit: productUnit.trim() || '১ কেজি',
          sellerProductImageUrl: finalProductPhoto,
          photos: uploadedPhotosList,
        },
      });

      if (!unifiedResult.success) {
        setIsSubmitting(false);
        if (unifiedResult.tableErrors?.includes('duplicate_constraint_23505') || (unifiedResult as any).isDuplicate || (unifiedResult.error && unifiedResult.error.includes('পূর্বেই রেজিস্ট্রেশন করা হয়েছে'))) {
          setErrorMsg('এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।');
        } else {
          setErrorMsg(unifiedResult.error || 'রেজিস্ট্রেশন সম্পন্ন করতে সমস্যা হয়েছে।');
        }
        return;
      }

      const userId = unifiedResult.user?.id || 'seller_' + Date.now();
      const newSellerProfile: UserProfile = {
        id: userId,
        name: productNameOrBusiness.trim() || productName.trim(),
        fullName: productNameOrBusiness.trim() || productName.trim(),
        shopName: productNameOrBusiness.trim() || productName.trim(),
        businessName: productNameOrBusiness.trim() || productName.trim(),
        productName: productName.trim() || productNameOrBusiness.trim(),
        productNameOrBusiness: productNameOrBusiness.trim() || productName.trim(),
        ownerName: productNameOrBusiness.trim() || productName.trim(),
        phone: cleanPhone,
        email: cleanEmail || undefined,
        password: password,
        division,
        district,
        upazila,
        thana: upazila,
        mahalla,
        para: mahalla,
        paraMahalla: `${mahalla}, ${upazila}`,
        avatar: finalProductPhoto || shopBannerUrl || '',
        categorySkill: 'ভেরিফাইড মার্চেন্ট / বিক্রেতা',
        profession: 'মার্চেন্ট / বিক্রেতা',
        professionBn: 'মার্চেন্ট / বিক্রেতা',
        role: 'seller',
        detailedAddress: shopAddress,
        nidNumber: cleanNid || 'NID-VERIFIED-SELLER',
        isNidVerified: true,
        isPaidMember: true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Construct Real Initial Product
      const newProductItem: Product = {
        id: `prod_${Date.now()}`,
        nameBn: productName.trim() || productNameOrBusiness.trim(),
        nameEn: productName.trim() || productNameOrBusiness.trim(),
        title: productName.trim() || productNameOrBusiness.trim(),
        category: productItemCategory,
        price: parseFloat(productPrice) || 650,
        regularPrice: parseFloat(productPrice) || 650,
        originalPrice: parseFloat(productPrice) || 650,
        unit: productUnit.trim() || '১ কেজি',
        descriptionBn: productDescription.trim(),
        description: productDescription.trim(),
        image: finalProductPhoto,
        images: uploadedPhotosList.length > 0 ? uploadedPhotosList : [finalProductPhoto],
        stock: 25,
        inStock: true,
        sellerId: userId,
        sellerName: productNameOrBusiness.trim() || productName.trim(),
        sellerPhone: cleanPhone,
        district: district,
        upazila: upazila,
        location: `${upazila}, ${district}`,
        rating: 5.0,
        reviewsCount: 1,
      };

      (newSellerProfile as any).products = [newProductItem];

      // Store in localStorage for immediate profile loading
      try {
        const userKey = newSellerProfile.id || newSellerProfile.uniqueId || cleanPhone;
        localStorage.setItem(`seller_products_${userKey}`, JSON.stringify([newProductItem]));
        if (cleanPhone) {
          localStorage.setItem(`seller_products_${cleanPhone}`, JSON.stringify([newProductItem]));
        }
        if (newSellerProfile.uniqueId) {
          localStorage.setItem(`seller_products_${newSellerProfile.uniqueId}`, JSON.stringify([newProductItem]));
        }
      } catch (storageErr) {
        console.warn('LocalStorage save note:', storageErr);
      }

      const result = await databaseService.saveUserProfile({
        ...newSellerProfile,
        shopName: productNameOrBusiness.trim() || productName.trim(),
        ownerName: productNameOrBusiness.trim() || productName.trim(),
        businessName: productNameOrBusiness.trim() || productName.trim(),
        productName: productName.trim() || productNameOrBusiness.trim(),
        productNameOrBusiness: productNameOrBusiness.trim() || productName.trim(),
        businessCategory,
        tradeLicenseOrNid: cleanNid,
      });

      // 1. Direct safe sync to Supabase sellers table
      try {
        const sellerPayload = prepareSellerPayload({
          full_name: productNameOrBusiness.trim() || productName.trim(),
          name: productNameOrBusiness.trim() || productName.trim(),
          shop_name: productNameOrBusiness.trim() || productName.trim(),
          business_name: productNameOrBusiness.trim() || productName.trim(),
          phone: cleanPhone,
          phone_number: cleanPhone,
          email: cleanEmail || null,
          address: shopAddress,
          district: district,
          upazila: upazila,
          area: mahalla,
          nid_number: cleanNid || null,
          trade_license: cleanNid || null,
          product_category: businessCategory,
          image_url: finalProductPhoto || shopBannerUrl || null,
          products_photos: finalProductPhoto || shopBannerUrl || null,
          status: 'approved'
        });
        console.log("[Seller Registration] Supabase sellers payload:", sellerPayload);
        const { data: sellerData, error: sellerErr } = await supabase.from('sellers').insert([sellerPayload]);
        if (sellerErr) {
          console.error("SUPABASE SELLERS INSERTION ERROR:", sellerErr);
          alert("সেলার টেবিলে তথ্য সেভ হতে ব্যর্থ হয়েছে: " + sellerErr.message);
        } else {
          console.log("SUPABASE SELLERS INSERTION SUCCESS:", sellerData);
        }
      } catch (e: any) {
        console.warn('Supabase sellers table sync warning:', e);
      }

      // 2. Direct safe sync to Supabase product_sellers table
      try {
        const prodSellerPayload = prepareProductSellerPayload({
          product_name: productName.trim() || productNameOrBusiness.trim(),
          products_name: productName.trim() || productNameOrBusiness.trim(),
          phone: cleanPhone,
          phone_number: cleanPhone,
          district: district,
          upazila: upazila,
          pass_word: password,
          password: password,
          products_photos: finalProductPhoto || shopBannerUrl || null,
          image_url: finalProductPhoto || shopBannerUrl || null,
          description: productDescription.trim() || `${productNameOrBusiness.trim()} - বিক্রেতা রেজিস্ট্রেশন`
        });
        console.log("[Seller Registration] Supabase product_sellers payload:", prodSellerPayload);
        const { data: prodSellerData, error: prodSellerErr } = await supabase.from('product_sellers').insert([prodSellerPayload]);
        if (prodSellerErr) {
          console.error("SUPABASE PRODUCT SELLERS INSERTION ERROR:", prodSellerErr);
        } else {
          console.log("SUPABASE PRODUCT SELLERS INSERTION SUCCESS:", prodSellerData);
        }
      } catch (e: any) {
        console.warn('Supabase product_sellers table sync warning:', e);
      }

      // 3. Direct safe sync to Supabase products table
      try {
        const prodPayload = {
          title: productName.trim() || productNameOrBusiness.trim(),
          name: productName.trim() || productNameOrBusiness.trim(),
          name_bn: productName.trim() || productNameOrBusiness.trim(),
          category: productItemCategory,
          price: parseFloat(productPrice) || 650,
          regular_price: parseFloat(productPrice) || 650,
          stock: 1,
          unit: productUnit.trim() || '১ কেজি',
          description: productDescription.trim(),
          description_bn: productDescription.trim(),
          image_url: finalProductPhoto,
          photos: uploadedPhotosList,
          seller_id: userId,
          seller_name: productNameOrBusiness.trim() || productName.trim(),
          seller_phone: cleanPhone,
          district: district,
          upazila: upazila,
          location: `${upazila}, ${district}`,
        };
        console.log("[Seller Registration] Supabase product payload:", prodPayload);
        const { data: prodData, error: prodErr } = await supabase.from('products').insert([prodPayload]);
        if (prodErr) {
          console.error("SUPABASE PRODUCT INSERTION ERROR:", prodErr);
          alert("পণ্য টেবিলে তথ্য সেভ হতে ব্যর্থ হয়েছে: " + prodErr.message);
        } else {
          console.log("SUPABASE PRODUCT INSERTION SUCCESS:", prodData);
        }
      } catch (prodErr: any) {
        console.warn('Supabase product insert note:', prodErr);
      }

      if (!result.success) {
        throw new Error(result.error || 'ফায়ারস্টোরে সেভ করা সম্ভব হয়নি');
      }

      await fetch('/api/auth/register-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSellerProfile,
          shopName,
          ownerName,
          businessCategory,
          tradeLicenseOrNid: cleanNid,
        }),
      }).catch(() => {});

      setIsSubmitting(false);
      alert(
        lang === 'bn'
          ? `🎉 অভিনন্দন ${shopName}!\nআপনার বিক্রেতা প্রোফাইল ও প্রথম পণ্য "${newProductItem.nameBn}" সফলভাবে যুক্ত হয়েছে!`
          : `Congratulations ${shopName}! Your Seller Account & first product are now active.`
      );
      onSuccess(newSellerProfile);
      onClose();
    } catch (err: any) {
      console.error('Registration error for seller:', err);
      setIsSubmitting(false);
      setErrorMsg(
        lang === 'bn'
          ? `রেজিস্ট্রেশন ব্যর্থ হয়েছে: ${err?.message || 'ডাটাবেস কানেকশন এরর'}`
          : `Registration failed: ${err?.message || 'Database connection error'}`
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#B80000] to-[#8A0000] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-none">
                {lang === 'bn' ? '🏪 বিক্রেতা রেজিস্ট্রেশন (Seller Registration)' : 'Seller / Merchant Registration'}
              </h3>
              <p className="text-[10px] text-white/80 mt-1">
                {lang === 'bn' ? 'দোকান বা পণ্যের বিক্রেতা হিসেবে সহজে রেজিস্ট্রেশন করুন' : 'Sell your products on Jhadimadi Marketplace'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* একক সমন্বিত ইনপুট ফিল্ড: পণ্যের নাম / ব্যবসার নাম (Product Name / Business Name) */}
          <div>
            <label className="font-extrabold text-slate-800 block text-[11px] mb-1">
              {lang === 'bn' ? '১. পণ্যের নাম / ব্যবসার নাম (Product Name / Business Name):' : '1. Product Name / Business Name:'} <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Store className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                required
                value={productNameOrBusiness}
                onChange={(e) => setProductNameOrBusiness(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: রাঙ্গামাটি অর্গানিক মধু / পাহাড়ি হস্তশিল্প / গ্রিন হিল স্টোর' : 'e.g. Organic Honey / Hill Handicrafts / Green Hill Store'}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B80000] focus:bg-white"
                id="modal-input-product-business-name"
              />
            </div>
          </div>

          {/* Business Category */}
          <div>
            <label className="font-extrabold text-slate-800 block text-[11px] mb-1">
              {lang === 'bn' ? '২. ব্যবসার প্রধান ক্যাটাগরি:' : '2. Business Category:'}
            </label>
            <select
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B80000] cursor-pointer"
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.labelBn}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-800 block text-[11px] mb-1">
                {lang === 'bn' ? '৪. মোবাইল নম্বর (Phone):' : '4. Phone:'} <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01812345678"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B80000] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-extrabold text-slate-800 block text-[11px] mb-1">
                {lang === 'bn' ? '৫. ইমেইল এড্রেস (ঐচ্ছিক):' : '5. Email (Optional):'}
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shop@jhadimadi.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B80000] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Custom Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-extrabold text-slate-800 text-[11px]">
                {lang === 'bn' ? '৬. পছন্দসই পাসওয়ার্ড সেট করুন:' : '6. Set Custom Password:'} <span className="text-red-500">*</span>
              </label>
              <span className="text-[9px] text-[#B80000] font-bold">লগইন করার জন্য পিন/পাসওয়ার্ড</span>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন (কমপক্ষে ৬ অক্ষর)"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B80000] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Trade License / NID Number */}
          <div>
            <label className="font-extrabold text-slate-800 block text-[11px] mb-1">
              {lang === 'bn' ? '৭. ট্রেড লাইসেন্স বা এনআইডি নম্বর (NID / Trade License):' : '7. NID or Trade License:'}
            </label>
            <input
              type="text"
              value={tradeLicenseOrNid}
              onChange={(e) => setTradeLicenseOrNid(e.target.value)}
              placeholder="এনআইডি বা ট্রেড লাইসেন্স নম্বর (ভেরিফিকেশনের জন্য)"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B80000] focus:bg-white"
            />
          </div>

          {/* Location Details */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-[#B80000]" />
              <span>{lang === 'bn' ? '৮. দোকানের ভৌগোলিক অবস্থান ও ঠিকানা:' : '8. Shop Location & Address:'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="জেলা (District)"
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800"
              />
              <input
                type="text"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                placeholder="উপজেলা / থানা (Upazila)"
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800"
              />
            </div>

            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="দোকানের পূর্ণ ঠিকানা / বাজার / রোড নম্বর"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10.5px] font-medium text-slate-800"
            />
          </div>

          {/* ========================================================
              ৯. পণ্যের বিস্তারিত বিবরণ ও ছবি আপলোড (Product Details & Photos)
             ======================================================== */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border-2 border-emerald-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-black text-emerald-950 text-xs leading-none">
                  {lang === 'bn' ? '৯. পণ্যের বিস্তারিত বিবরণ ও ছবি আপলোড' : '9. Product Details & Image Upload'}
                </h4>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  {lang === 'bn' ? 'আপনার দোকানের প্রথম পণ্যটি যুক্ত করে ক্যাটালগ তৈরি করুন' : 'List your initial product to showcase in your store'}
                </p>
              </div>
            </div>

            {/* পণ্যের নাম বা শিরোনাম */}
            <div>
              <label className="font-extrabold text-slate-800 block text-[10.5px] mb-1">
                {lang === 'bn' ? 'পণ্যের নাম বা শিরোনাম (Product Name) *' : 'Product Name / Title *'}
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: খাগড়াছড়ির প্রাকৃতিক পাহাড়ি খাঁটি মধু / মারমা থামি' : 'e.g. Hill Pure Organic Honey / Handwoven Thami'}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>

            {/* পণ্যের সুনির্দিষ্ট ক্যাটাগরি */}
            <div>
              <label className="font-extrabold text-slate-800 block text-[10.5px] mb-1">
                {lang === 'bn' ? 'পণ্যের ক্যাটাগরি (Product Category) *' : 'Product Category *'}
              </label>
              <select
                value={productItemCategory}
                onChange={(e) => setProductItemCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
              >
                {SELLER_PRODUCT_CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* মূল্য ও প্যাকেজিং / ইউনিট */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-extrabold text-slate-800 block text-[10.5px] mb-1">
                  {lang === 'bn' ? 'বিক্রয় মূল্য (টাকা) *' : 'Selling Price (BDT) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="যেমন: ৬৫০"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block text-[10.5px] mb-1">
                  {lang === 'bn' ? 'প্যাকেজিং / ইউনিট *' : 'Packaging / Unit *'}
                </label>
                <input
                  type="text"
                  required
                  value={productUnit}
                  onChange={(e) => setProductUnit(e.target.value)}
                  placeholder="যেমন: ১ কেজি / ১ পিস"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>

            {/* পণ্যের পূর্ণ বিবরণ */}
            <div>
              <label className="font-extrabold text-slate-800 block text-[10.5px] mb-1">
                {lang === 'bn' ? 'পণ্যের বিস্তারিত বিবরণ ও বৈশিষ্ট্য (Description) *' : 'Product Full Description *'}
              </label>
              <textarea
                rows={3}
                required
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder={lang === 'bn' ? 'পণ্যটি কোথা থেকে সংগৃহীত, এর বিশুদ্ধতা, ওজন, প্রস্তুত প্রণালী এবং গ্রাহক কীভাবে ব্যবহার করবেন তা লিখুন...' : 'Write detailed product specifications, quality assurance, origin, usage instructions...'}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 shadow-2xs leading-relaxed"
              />
            </div>

            {/* পণ্যের ছবি আপলোড ও প্রিভিউ */}
            <div className="space-y-2 pt-1 border-t border-emerald-200/80">
              <label className="font-extrabold text-slate-800 block text-[10.5px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'bn' ? 'পণ্যের ছবি আপলোড করুন (Product Photos) *' : 'Upload Product Images *'}</span>
                </span>
                <span className="text-[9.5px] text-emerald-800 font-bold">
                  {productImages.length > 0 ? `${productImages.length}টি ছবি যুক্ত` : 'ছবি আবশ্যক'}
                </span>
              </label>

              {/* ফাইল আপলোড বাটন */}
              <label
                htmlFor="seller-modal-product-file"
                className="border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-white p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs hover:bg-emerald-50/50"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-950 text-[11px] leading-tight">
                    {lang === 'bn' ? 'ডিভাইস বা গ্যালারি থেকে ছবি সিলেক্ট করুন' : 'Select photos from device'}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    {lang === 'bn' ? 'ক্যামেরা বা মেমোরি থেকে ১ বা একাধিক ছবি যুক্ত করতে পারবেন' : 'JPG, PNG or WEBP formats'}
                  </p>
                </div>
                <input
                  id="seller-modal-product-file"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>

              {/* ছবির সরাসরি ওয়েব লিঙ্ক */}
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={productImageUrlInput}
                  onChange={(e) => setProductImageUrlInput(e.target.value)}
                  placeholder="অথবা ছবির ওয়েব লিঙ্ক (URL) পেস্ট করুন..."
                  className="flex-1 px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'যোগ করুন' : 'Add'}</span>
                </button>
              </div>

              {/* ছবি প্রিভিউ থাম্বনেইল গ্রিড */}
              {productImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {productImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-emerald-300 aspect-square bg-white shadow-2xs">
                      <img
                        src={img.url}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow-xs cursor-pointer"
                        title="ছবি মুছুন"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#B80000] hover:bg-[#990000] text-white font-black text-xs rounded-xl shadow-lg shadow-[#B80000]/30 cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  <span>বিক্রেতা হিসেবে রেজিস্ট্রেশন সম্পন্ন করুন ➔</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-2.5 px-4 text-[9.5px] text-slate-500 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>১০০% নিরাপদ ভেরিফাইড বিক্রেতা পোর্টাল</span>
          </span>
          <span className="text-slate-400">Jhadimadi Seller Portal</span>
        </div>

      </div>
    </div>
  );
};