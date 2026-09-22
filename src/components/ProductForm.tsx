import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { ShoppingBag, DollarSign, MapPin, Phone, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Upload, X } from 'lucide-react';
import { LOCATION_MASTER } from '../data/locationMaster';
import { PRODUCT_CATEGORIES } from './admin/AdminProductsTab';
import { uploadFileToSupabaseStorage } from '../utils/directSupabaseStorage';
import { databaseService } from '../services/databaseService';

export interface ProductFormProps {
  initialData?: any;
  onSuccess?: (product: any) => void;
  onCancel?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const allDistricts = LOCATION_MASTER.flatMap(d => d.districts);
  const [prodTitle, setProdTitle] = useState(initialData?.name_bn || initialData?.title || initialData?.name || '');
  const [prodCategory, setProdCategory] = useState(initialData?.category || PRODUCT_CATEGORIES[0]?.labelBn || 'অন্যanya');
  const [prodPrice, setProdPrice] = useState<number | string>(initialData?.price || '');
  const [prodStock, setProdStock] = useState<number | string>(initialData?.stock || initialData?.stock_quantity || '10');
  const [prodDesc, setProdDesc] = useState(initialData?.description || '');
  const [dist, setDist] = useState(initialData?.district || 'খাগড়াছড়ি');
  const [upazilaName, setUpazilaName] = useState(initialData?.upazila || 'খাগড়াছড়ি সদর');
  const [areaName, setAreaName] = useState(initialData?.area || '');
  const [sellerPhoneNum, setSellerPhoneNum] = useState(initialData?.seller_phone || initialData?.phone || '');
  const [imgUrl, setImgUrl] = useState(initialData?.image_url || initialData?.image || '');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentDistrictObj = allDistricts.find(d => d.nameBn === dist) || allDistricts[0];
  const upazilas = currentDistrictObj ? currentDistrictObj.upazilas.map(u => u.nameBn) : ['খাগড়াছড়ি সদর'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      try {
        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setImagePreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!prodTitle.trim() || !prodPrice || !sellerPhoneNum.trim()) {
      setMessage({ type: 'error', text: 'অনুগ্রহ করে পণ্যের নাম, মূল্য এবং বিক্রেতার ফোন নম্বর দিন।' });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = imgUrl.trim();

      // সরাসরি Supabase Storage-এ ফাইল আপলোড হ্যান্ডেল করা
      if (selectedImageFile) {
        try {
          const publicUrl = await uploadFileToSupabaseStorage('products', selectedImageFile);
          if (publicUrl) {
            finalImageUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.error('Storage upload error:', uploadErr);
        }
      }

      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'; // ফ্যালব্যাক ইমেজ
      }

      setImgUrl(finalImageUrl);

      const regularPrice = Number(prodPrice) || 0;
      const stockQty = Number(prodStock) || 1;

      // ডাটাবেজ নিরাপদ পেলেলোড প্রস্তুত করা (SAFE PRODUCT INSERTION - FALLBACK TO ESSENTIAL FIELDS)
      const formData = {
        name_bn: prodTitle.trim(),
        title: prodTitle.trim(),
        price: regularPrice,
        category: prodCategory,
        image_url: finalImageUrl,
        image: finalImageUrl,
        description: prodDesc.trim(),
        stock: stockQty
      };

      const safeProductPayload = {
        title: formData.name_bn || formData.title || 'নতুন পণ্য',
        price: Number(formData.price) || 0,
        category: formData.category || 'সাধারণ',
        image_url: formData.image_url || formData.image || '',
        description: formData.description || '',
        stock: Number(formData.stock) || 10
      };

      let insertedRecord: any = null;

      // সরাসরি Supabase ক্লায়েন্ট দিয়ে ডাটাবেজে ইনসার্ট করা - ট্রাই-ক্যাচ ও সতর্কবার্তা সহ
      try {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert([safeProductPayload])
          .select()
          .single();

        if (insertError) {
          console.error('[Supabase Database Insert Error on products]:', insertError);
          alert(`পণ্য সংরক্ষণে সমস্যা: ${insertError.message || JSON.stringify(insertError)}`);
          setMessage({
            type: 'error',
            text: `পণ্য ডেটাবেজে সংরক্ষণে সমস্যা: ${insertError.message || 'Database error'}`
          });
          setIsSubmitting(false);
          return;
        }

        insertedRecord = data;
      } catch (insertEx: any) {
        console.error('[Supabase Database Insert Exception on products]:', insertEx);
        alert(`পণ্য সংরক্ষণে ত্রুটি: ${insertEx?.message || insertEx}`);
        setMessage({
          type: 'error',
          text: `পণ্য ডেটাবেজে সংরক্ষণে সমস্যা: ${insertEx?.message || 'Database error'}`
        });
        setIsSubmitting(false);
        return;
      }

      setMessage({
        type: 'success',
        text: 'সফল! পণ্যটি সফলভাবে ডেটাবেজে সংরক্ষিত হয়েছে।'
      });

      try {
        databaseService.notifyEntityChange('products');
        databaseService.fetchProductsFromSupabase().catch(() => {});
      } catch (_) {}

      if (onSuccess) {
        onSuccess(insertedRecord || safeProductPayload);
      }
    } catch (err: any) {
      console.error('Product submission error:', err);
      setMessage({
        type: 'error',
        text: `অপ্রত্যাশিত সমস্যা দেখা দিয়েছে: ${err?.message || 'অনুগ্রহ করে আবার চেষ্টা করুন'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 max-w-2xl mx-auto">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800">পণ্য আপলোড / প্রোডাক্ট ফর্ম</h2>
        <p className="text-sm text-slate-500">ঝাদিমাদি পাহাড়ি বাজার বা অনলাইন শপে নতুন পণ্য যুক্ত করুন</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">পণ্যের নাম / শিরোনাম (Title) *</label>
          <div className="relative">
            <ShoppingBag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={prodTitle}
              onChange={(e) => setProdTitle(e.target.value)}
              placeholder="যেমন: পাহাড়ি হলুদ বা আনারস"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যাটাগরি *</label>
          <select
            value={prodCategory}
            onChange={(e) => setProdCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
          >
            {PRODUCT_CATEGORIES.map((c, idx) => (
              <option key={idx} value={c.labelBn}>{c.labelBn}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">মূল্য (Price in BDT) *</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={prodPrice}
              onChange={(e) => setProdPrice(e.target.value)}
              placeholder="যেমন: 350"
              required
              min={1}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">বিক্রেতার ফোন নম্বর (Seller Phone) *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={sellerPhoneNum}
              onChange={(e) => setSellerPhoneNum(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">জেলা (District) *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={dist}
              onChange={(e) => setDist(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {allDistricts.map((d, idx) => (
                <option key={idx} value={d.nameBn}>{d.nameBn}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">উপজেলা (Upazila) *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={upazilaName}
              onChange={(e) => setUpazilaName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {upazilas.map((u, idx) => (
                <option key={idx} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>পণ্যের ছবি (মোবাইল বা পিসি থেকে সরাসরি আপলোড)</span>
          <span className="text-[10px] text-emerald-600 font-bold">সরাসরি Supabase Storage-এ জমা হবে</span>
        </label>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="product-form-file-input"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition cursor-pointer shrink-0"
            id="btn-product-form-browse"
          >
            <Upload className="w-4 h-4" />
            {selectedImageFile ? 'অন্য ছবি নির্বাচন' : 'ফোন/পিসি থেকে ছবি বাছুন'}
          </button>

          <div className="flex-1 text-xs text-slate-500 truncate">
            {selectedImageFile ? (
              <span className="text-emerald-700 font-semibold truncate flex items-center gap-1">
                ✓ {selectedImageFile.name} ({(selectedImageFile.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              'ছবি নির্বাচন করুন অথবা নিচে সরাসরি ছবির লিংক দিন'
            )}
          </div>
        </div>

        {(imagePreview || imgUrl) && (
          <div className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs">
            <img
              src={imagePreview || imgUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedImageFile(null);
                setImagePreview('');
                setImgUrl('');
              }}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition"
              title="মুছুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">অথবা ছবির সরাসরি লিংক (Image URL)</label>
        <div className="relative">
          <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="url"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            placeholder="https://example.com/product-image.jpg"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            id="input-product-form-imgurl"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">পণ্যের বর্ণনা (Description)</label>
        <textarea
          rows={3}
          value={prodDesc}
          onChange={(e) => setProdDesc(e.target.value)}
          placeholder="পণ্যের গুণাগুণ ও বিস্তারিত বর্ণনা..."
          className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            বাতিল
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              সংরক্ষণ হচ্ছে...
            </>
          ) : (
            'পণ্য সংরক্ষণ করুন'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;