import React, { useState, useRef } from 'react';
import { X, Upload, Plus, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { PRODUCT_CATEGORIES } from './admin/AdminProductsTab';
import { supabase } from '../supabase';
import { uploadFileToSupabaseStorage, isLocalTransientUrl, getProductPublicUrl } from '../utils/directSupabaseStorage';
import { submitFormData } from '../services/unifiedRegistrationService';
import { databaseService } from '../services/databaseService';
import { 
  smartSupabaseUpload, 
  smartSupabaseInsert, 
  prepareProductPayload, 
  FALLBACK_PRODUCT_IMAGE 
} from '../utils/supabaseDataService';

interface ProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductData) => void;
}

export interface ProductData {
  name: string;
  category: string;
  price: number;
  stock: number;
  microLocation: string;
  description: string;
  image: string;
  sellerPhone?: string;
}

export const ProductAddModal: React.FC<ProductAddModalProps> = ({ isOpen, onClose, onAddProduct }) => {
  const [formData, setFormData] = useState<ProductData>({
    name: '',
    category: 'Food',
    price: 0,
    stock: 10,
    microLocation: 'খাগড়াছড়ি / সদর',
    description: '',
    image: '',
    sellerPhone: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
    setError('');

    if (!formData.name || !formData.price || !formData.microLocation) {
      setError('দয়া করে প্রয়োজনীয় তথ্যগুলো (নাম, দাম এবং লোকেশন) সঠিকভাবে পূরণ করুন।');
      return;
    }

    try {
      setLoading(true);

      const prodTitle = formData.name.trim();
      const prodCategory = formData.category;
      const prodPrice = Number(formData.price) || 0;
      const prodDesc = formData.description.trim() || `${formData.name.trim()} - টাটকা ও খাঁটি পাহাড়ি পণ্য।`;
      const locationParts = formData.microLocation.split(/[/,-]/);
      const dist = locationParts[0]?.trim() || 'খাগড়াছড়ি';
      const upazilaName = locationParts[1]?.trim() || 'সদর';
      const sellerPhoneNum = formData.sellerPhone?.trim() || '01870592699';

      let finalImageUrl = formData.image?.trim() || '';

      // =========================================================================
      // STEP 1: Upload Image to Supabase Storage ('products' bucket)
      // Handles errors gracefully: if storage fails, uses fallback and doesn't block!
      // =========================================================================
      if (selectedFile) {
        const uploadRes = await smartSupabaseUpload('products', selectedFile, 'product');
        finalImageUrl = uploadRes.url;
      } else if (imagePreview && isLocalTransientUrl(imagePreview)) {
        const uploadRes = await smartSupabaseUpload('products', imagePreview, 'product');
        finalImageUrl = uploadRes.url;
      }

      if (!finalImageUrl) {
        finalImageUrl = FALLBACK_PRODUCT_IMAGE;
      }

      // =========================================================================
      // STEP 2: Insert Product Record into Database ('products' table)
      // Uses smartSupabaseInsert which automatically aligns schema and strips missing columns
      // =========================================================================
      const productRecord = prepareProductPayload({
        name: prodTitle,
        price: prodPrice,
        category: prodCategory,
        description: prodDesc,
        image_url: finalImageUrl,
        stock_quantity: Number(formData.stock) || 1,
        seller_name: sellerPhoneNum || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট',
        district: dist,
        upazila: upazilaName
      });

      console.log('[ProductAddModal] Exact Supabase product payload:', productRecord);
      const insertRes = await smartSupabaseInsert('products', productRecord);

      if (!insertRes.success) {
        console.error('[ProductAddModal] Database insert error:', insertRes.error);
        alert(`পণ্য ডেটাবেজে সংরক্ষণে সমস্যা: ${insertRes.error?.message || 'Database error'}`);
        setError(`পণ্য ডেটাবেজে সংরক্ষণে সমস্যা: ${insertRes.error?.message || 'Database error'}`);
        setLoading(false);
        return;
      } else {
        console.log('[ProductAddModal] Supabase insert success:', insertRes.data);
        alert("পণ্য সফলভাবে ডেটাবেজে যোগ করা হয়েছে!");
      }

      const finalProductData: ProductData = {
        ...formData,
        image: finalImageUrl,
      };

      await onAddProduct(finalProductData);
      try {
        databaseService.notifyEntityChange('products');
        databaseService.fetchProductsFromSupabase().catch(() => {});
      } catch (_) {}
      onClose();
    } catch (err: any) {
      console.error('Product submit error:', err);
      setError(`পণ্য যোগ করতে সমস্যা হয়েছে: ${err?.message || 'আবার চেষ্টা করুন।'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" id="modal-product-add">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl transition-all border border-gray-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" /> নতুন পণ্য যোগ করুন
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 max-h-[80vh] overflow-y-auto" id="form-product-add">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">পণ্যের নাম (Name) *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="যেমন: খাগড়াছড়ির পাহাড়ি হলুদ বা আনারস"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
              id="input-product-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ক্যাটাগরি *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                id="select-product-category"
              >
                {PRODUCT_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.labelBn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">মাইক্রো-লোকেশন (জেলা / উপজেলা) *</label>
              <input
                type="text"
                name="microLocation"
                value={formData.microLocation}
                onChange={handleChange}
                placeholder="যেমন: খাগড়াছড়ি / মাটিরাঙ্গা"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
                id="input-product-location"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">মূল্য (টাকা) *</label>
              <input
                type="number"
                name="price"
                value={formData.price === 0 ? '' : formData.price}
                onChange={handleChange}
                placeholder="০.০০"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
                id="input-product-price"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">স্টক পরিমাণ</label>
              <input
                type="number"
                name="stock"
                value={formData.stock === 0 ? '' : formData.stock}
                onChange={handleChange}
                placeholder="১০"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                id="input-product-stock"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">মোবাইল নম্বর</label>
              <input
                type="tel"
                name="sellerPhone"
                value={formData.sellerPhone}
                onChange={handleChange}
                placeholder="018XXXXXXXX"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                id="input-product-seller-phone"
              />
            </div>
          </div>

          {/* Direct File/Image Upload Section from Mobile/Computer */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>পণ্যের ছবি (মোবাইল/কম্পিউটার থেকে সরাসরি আপলোড)</span>
              <span className="text-[10px] text-emerald-600 font-semibold">ক্লাউড স্টোরেজে সরাসরি সংরক্ষণ</span>
            </label>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="product-file-upload-input"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition cursor-pointer shrink-0"
                id="btn-product-browse-image"
              >
                <Upload className="w-4 h-4" />
                {selectedFile ? 'অন্য ছবি পরিবর্তন' : 'ফোন/পিসি থেকে ছবি বাছুন'}
              </button>

              <div className="flex-1 text-xs text-gray-500 truncate">
                {selectedFile ? (
                  <span className="text-emerald-700 font-semibold truncate flex items-center gap-1">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  'কোনো ফাইল নির্বাচন করা হয়নি'
                )}
              </div>
            </div>

            {/* Image Preview */}
            {(imagePreview || formData.image) && (
              <div className="mt-2.5 relative w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shadow-2xs">
                <img
                  src={imagePreview || formData.image}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview('');
                    setFormData(prev => ({ ...prev, image: '' }));
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
            <label className="block text-xs font-bold text-gray-700 mb-1">পণ্যের বিবরণ (Description)</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="পণ্য সম্পর্কে বিস্তারিত বর্ণনা লিখুন..."
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              id="textarea-product-desc"
            />
          </div>

          {/* Modal Footer / Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
              id="btn-product-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  স্টোরেজে আপলোড ও সংরক্ষণ হচ্ছে...
                </>
              ) : (
                'পণ্য প্রকাশ করুন'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};