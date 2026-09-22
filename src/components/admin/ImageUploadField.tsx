import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Upload,
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle,
  Link2,
  Eye,
  Database,
  CloudLightning,
  Sparkles
} from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import { SupabaseMediaPickerModal } from './SupabaseMediaPickerModal';
import { supabaseMediaService } from '../../services/supabaseMediaService';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { NO_IMAGE_AVAILABLE_ICON } from '../../constants/imageConstants';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (imageUrl: string) => void;
  helperText?: string;
  recommendedSize?: string;
  aspectRatioLabel?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  presets?: { label: string; url: string }[];
  required?: boolean;
  bucket?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  helperText = 'আপনার কম্পিউটার বা ডিভাইস থেকে ছবি নির্বাচন করুন (PNG, JPG, WebP)',
  recommendedSize = 'সর্বোচ্চ ৫ মেগাবাইট',
  aspectRatioLabel,
  maxWidth = 1000,
  maxHeight = 700,
  quality = 0.82,
  presets = [],
  required = false,
  bucket = 'products'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSupabasePickerOpen, setIsSupabasePickerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const processFile = async (file: File) => {
    setErrorMessage(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const safeExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!file.type.startsWith('image/') || !safeExtensions.includes(ext) || file.type.includes('svg') || file.type.includes('html')) {
      setErrorMessage('নিরাপত্তা কারণে শুধুমাত্র ছবি ফাইল (PNG, JPG, WebP) আপলোড করুন।');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('ছবির সাইজ ১৫ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    setIsProcessing(true);
    try {
      // ১. ফাইলের একটি ইউনিক নাম তৈরি করা
      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      let fileToUpload: File | Blob = file;
      try {
        const compressed = await compressImage(file, maxWidth, maxHeight, quality);
        if (compressed && compressed.startsWith('data:image/')) {
          const res = await fetch(compressed);
          fileToUpload = await res.blob();
        }
      } catch {
        fileToUpload = file;
      }

      // ২. সরাসরি Supabase Storage-এর বাক্সে (products বা banners) আপলোড করা
      const targetBucket = bucket || 'products';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, fileToUpload, {
          cacheControl: '31536000',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (!uploadError && uploadData?.path) {
        // ৩. আপলোড হওয়া ছবির স্থায়ী পাবলিক (Public) URL বের করা
        const { data: publicURLData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(uploadData.path || filePath);

        const permanentImageUrl = publicURLData?.publicUrl;
        if (permanentImageUrl) {
          onChange(permanentImageUrl);
          return;
        }
      }

      // Fallback via supabaseMediaService if direct storage threw error
      const uploadRes = await supabaseMediaService.uploadToSupabase(file, { bucket: targetBucket });
      if (uploadRes.success && uploadRes.url) {
        onChange(uploadRes.url);
        return;
      }

      // If upload failed, display clear message with actionable guidance
      let friendlyError = uploadError?.message || uploadRes.error || 'সুপাবেস ক্লাউড স্টোরেজে ছবি আপলোড সম্পন্ন করা যায়নি। বাকেট ও RLS পলিসি কনফিগারেশন নিশ্চিত করুন।';
      if (friendlyError.includes('is_staff') || friendlyError.includes('400') || friendlyError.includes('schema mismatch')) {
        friendlyError = 'Supabase Storage RLS/is_staff সমস্যা পরিলক্ষিত হয়েছে। অ্যাডমিন প্যানেলের "Supabase DB" ট্যাব থেকে ১-ক্লিকে Migration 029 SQL কপি করে Supabase SQL Editor-এ রান করলে স্থায়ী সমাধান হবে।';
      }
      setErrorMessage(friendlyError);
    } catch (err: any) {
      console.error('[ImageUpload] Error processing image:', err);
      let errMsg = err?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
      if (errMsg.includes('is_staff') || errMsg.includes('400') || errMsg.includes('schema mismatch')) {
        errMsg = 'Supabase Storage RLS/is_staff সমস্যা। অ্যাডমিন প্যানেলের "Supabase DB" ট্যাব থেকে Migration 029 SQL রান করুন।';
      }
      setErrorMessage(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so the same file can be re-selected if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    setErrorMessage(null);
    setManualUrl('');
  };

  const handleApplyUrl = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setShowUrlInput(false);
      setManualUrl('');
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Info */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        </label>
        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setIsSupabasePickerOpen(true)}
            className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md font-bold border border-emerald-300/80 transition flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Supabase Database ও Cloud Storage থেকে ছবি ব্রাউজ করুন"
          >
            <Database className="w-3 h-3 text-emerald-600" />
            <span>Supabase ডাটাবেজ</span>
          </button>
          {aspectRatioLabel && (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200/60">
              {aspectRatioLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer font-medium"
          >
            <Link2 className="w-3 h-3" />
            <span>{showUrlInput ? 'ফাইল আপলোড মোড' : 'URL ইনপুট'}</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input for Native PC/Phone Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Optional Manual URL Input */}
      {showUrlInput && (
        <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            প্রয়োগ করুন
          </button>
        </div>
      )}

      {/* Image Preview Box (If Image is Selected) */}
      {value ? (
        <div className="relative bg-slate-900 border-2 border-emerald-500/40 rounded-2xl overflow-hidden p-3 shadow-sm transition-all group">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            
            {/* Image Thumbnail */}
            <div className="relative w-full sm:w-48 h-32 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700/60 shrink-0">
              <img
                src={value}
                alt="Selected Upload"
                className="w-full h-full object-contain sm:object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                }}
              />
              <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>যুক্ত হয়েছে</span>
              </div>
            </div>

            {/* Actions & File Details */}
            <div className="flex-1 w-full space-y-2 text-left">
              <div>
                <div className="text-white text-xs font-bold flex items-center gap-1.5">
                  <span>ছবি নির্বাচন সফল</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {value.includes('supabase.co') || value.includes('storage/v1') ? '(Supabase Cloud)' : '(Ready)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-mono">
                  {value.startsWith('data:') ? 'লোকাল মেমোরি থেকে প্রসেসকৃত' : value}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSupabasePickerOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Supabase ইমেজ পিকার</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-600 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>পিসি থেকে আপলোড</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 active:scale-95 text-rose-200 border border-rose-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="ছবি মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>মুছে ফেলুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Drag-and-Drop Area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center transition-all cursor-pointer select-none group ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/20'
          }`}
        >
          {isProcessing ? (
            <div className="py-4 space-y-2">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">Supabase Storage-এ সরাসরি আপলোড ও প্রসেস করা হচ্ছে...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto text-emerald-600 group-hover:scale-110 group-hover:text-emerald-700 transition">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs font-black text-slate-800 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>কম্পিউটার থেকে ছবি সিলেক্ট করতে ক্লিক করুন</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  ছবি সরাসরি Supabase Storage '{bucket || 'products'}' বাকেটে আপলোড হয়ে স্থায়ী পাবলিক লিঙ্ক তৈরি হবে
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>কম্পিউটার থেকে ফাইল নিন</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSupabasePickerOpen(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-xs transition"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Supabase লাইব্রেরি</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 pt-1">
                {recommendedSize} • সর্বোচ্চ ১৫ মেগাবাইট
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preset Suggestions (If provided) */}
      {presets.length > 0 && !value && (
        <div className="pt-1 space-y-1">
          <span className="text-[10px] text-slate-400 block font-normal">অথবা ১-ক্লিকে প্রিসেট পাহাড়ি ছবি নিন:</span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, i) => (
              <button
                type="button"
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(p.url);
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Supabase Media Picker Modal */}
      <SupabaseMediaPickerModal
        isOpen={isSupabasePickerOpen}
        onClose={() => setIsSupabasePickerOpen(false)}
        onSelect={(urls) => {
          if (urls[0]) onChange(urls[0]);
        }}
        initialSelectedUrls={value ? [value] : []}
        allowMultiple={false}
      />
    </div>
  );
};
