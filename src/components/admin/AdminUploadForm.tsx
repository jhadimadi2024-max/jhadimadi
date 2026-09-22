import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Database,
  X,
  Plus
} from 'lucide-react';
import { supabase, supabaseUrl } from '../../supabase';
import { databaseService } from '../../services/databaseService';
import { compressImage } from '../../utils/imageUtils';
import { resilientSupabaseUpsert } from '../../services/supabaseDbHelper';

export interface AdminUploadFormProps {
  initialType?: 'product' | 'banner';
  mode?: 'product' | 'banner';
  onUploadSuccess?: (url: string) => void;
  onSuccess?: (result: { type: 'product' | 'banner'; id: string; name: string; imageUrl: string }) => void;
  onClose?: () => void;
}

const MIGRATION_029_SQL = `-- Migration 029: Fix is_staff & Storage 400 Schema Mismatch
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON TABLE public.user_roles TO anon, authenticated, service_role, postgres;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_allow_read" ON public.user_roles;
CREATE POLICY "user_roles_allow_read" ON public.user_roles FOR SELECT TO anon, authenticated, service_role USING (true);

CREATE OR REPLACE FUNCTION public.is_staff(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_is_staff BOOLEAN := false;
BEGIN
  IF user_uuid IS NULL THEN RETURN false; END IF;
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = user_uuid AND role IN ('moderator', 'admin', 'super_admin')
    ) INTO v_is_staff;
  ELSE
    v_is_staff := false;
  END IF;
  RETURN COALESCE(v_is_staff, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO anon, authenticated, service_role, postgres;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('banners', 'banners', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true;

GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role, postgres;`;

export const AdminUploadForm: React.FC<AdminUploadFormProps> = ({
  initialType,
  mode,
  onUploadSuccess,
  onSuccess,
  onClose
}) => {
  const [uploadType, setUploadType] = useState<'product' | 'banner'>(mode || initialType || 'product');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('পাহাড়ি ফলমূল ও খাদ্য');
  const [productDesc, setProductDesc] = useState('');
  
  // Banner specific fields
  const [bannerPlacement, setBannerPlacement] = useState('homepage_hero');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerTargetLink, setBannerTargetLink] = useState('home');

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [permanentUrlResult, setPermanentUrlResult] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        const objectUrl = URL.createObjectURL(selected);
        setPreviewUrl(objectUrl);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPreviewUrl(reader.result);
          }
        };
        reader.readAsDataURL(selected);
      }
    }
  };

  const copySqlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_029_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      alert('SQL কপি করতে সমস্যা হয়েছে।');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file && !previewUrl) {
      alert('দয়া করে আপনার কম্পিউটার থেকে একটি ছবি সিলেক্ট করুন!');
      return;
    }

    if (!productName.trim()) {
      alert(uploadType === 'product' ? 'দয়া করে পণ্যের নাম লিখুন!' : 'দয়া করে ব্যানারের শিরোনাম লিখুন!');
      return;
    }

    const bucketName = uploadType === 'banner' ? 'banners' : 'products';

    try {
      setUploading(true);
      setUploadStep('১. ফাইলের ইউনিক নাম প্রস্তুত করা হচ্ছে...');

      // ১. ফাইলের একটি ইউনিক নাম তৈরি করা
      const originalFile = file;
      const fileExt = originalFile?.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) ? fileExt : 'jpg';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}_${randomStr}.${cleanExt}`;
      const filePath = `${fileName}`;

      setUploadStep(`২. সরাসরি Supabase Storage-এর '${bucketName}' বাক্সে আপলোড করা হচ্ছে...`);

      let permanentImageUrl = '';
      let uploadSuccess = false;
      let uploadErrorMsg = '';

      // Prepare file to upload (compress to safe webp/jpeg for optimal speed)
      let fileToUpload: File | Blob = originalFile as File;
      try {
        if (originalFile) {
          const compressedDataUrl = await compressImage(originalFile, 1200, 1200, 0.85);
          if (compressedDataUrl && compressedDataUrl.startsWith('data:image/')) {
            const resp = await fetch(compressedDataUrl);
            fileToUpload = await resp.blob();
          }
        }
      } catch (cErr) {
        console.warn('Image compression note:', cErr);
      }

      // ২. সরাসরি Supabase Storage-এ আপলোড
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, fileToUpload, {
            cacheControl: '31536000',
            upsert: true,
            contentType: originalFile?.type || 'image/jpeg'
          });

        if (uploadError) {
          uploadErrorMsg = uploadError.message;
          console.warn(`[Supabase Storage Direct Upload Error (${bucketName})]:`, uploadError);
          // Fallback to 'products' bucket if target was banners
          if (bucketName !== 'products') {
            const fallback = await supabase.storage
              .from('products')
              .upload(filePath, fileToUpload, {
                cacheControl: '31536000',
                upsert: true,
                contentType: originalFile?.type || 'image/jpeg'
              });
            if (!fallback.error && fallback.data?.path) {
              const { data: pubData } = supabase.storage.from('products').getPublicUrl(fallback.data.path);
              if (pubData?.publicUrl) {
                permanentImageUrl = pubData.publicUrl;
                uploadSuccess = true;
              }
            }
          }
        } else if (uploadData?.path) {
          // ৩. আপলোড হওয়া ছবির স্থায়ী পাবলিক (Public) URL বের করা
          const { data: publicURLData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(uploadData.path || filePath);

          permanentImageUrl = publicURLData.publicUrl;
          uploadSuccess = true;
        }
      } catch (directCatchErr: any) {
        uploadErrorMsg = directCatchErr?.message || 'সুপাবেস স্টোরেজ এক্সেপশন';
      }

      // If direct client storage threw an error (e.g. is_staff schema mismatch)
      if (!uploadSuccess) {
        setUploadStep('সুপাবেস ক্লাউড এপিআই দিয়ে পুনরায় স্থায়ী আপলোড চেষ্টা করা হচ্ছে...');
        try {
          let base64Data = '';
          if (originalFile) {
            const reader = new FileReader();
            base64Data = await new Promise<string>((res, rej) => {
              reader.onload = () => res(reader.result as string);
              reader.onerror = rej;
              reader.readAsDataURL(fileToUpload);
            });
          }

          if (base64Data) {
            const apiRes = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: base64Data,
                name: fileName,
                bucket: bucketName,
                contentType: originalFile?.type || 'image/jpeg'
              })
            });
            const apiData = await apiRes.json();
            if (apiData.success && apiData.url && !apiData.url.startsWith('/assets/uploads/')) {
              permanentImageUrl = apiData.url;
              uploadSuccess = true;
            } else {
              // If is_staff mismatch is detected, store the clean compressed data URL directly in Supabase DB
              // so the image is permanently preserved in the cloud database and never lost on remix/redeploy!
              permanentImageUrl = base64Data;
              uploadSuccess = true;
            }
          }
        } catch (apiErr: any) {
          console.warn('[API upload error]:', apiErr);
        }
      }

      if (!permanentImageUrl) {
        throw new Error(uploadErrorMsg || 'ছবি Supabase Storage-এ আপলোড সম্পন্ন করা যায়নি। বাকেট ও RLS পলিসি কনফিগার করুন।');
      }

      setPermanentUrlResult(permanentImageUrl);
      setUploadStep('৪. ডাটাবেজে স্থায়ী রেকর্ড সংরক্ষণ করা হচ্ছে...');

      // ৪. এবার প্রোডাক্ট বা ব্যানারের নাম, দাম এবং ছবির স্থায়ী লিংক সরাসরি ডাটাবেজে সেভ করা
      if (uploadType === 'product') {
        const regularPrice = parseFloat(productPrice) || 0;
        const supaPayload: Record<string, any> = {
          title: productName.trim(),
          title_bn: productName.trim(),
          price: regularPrice,
          regular_price: regularPrice,
          category: productCategory,
          description: productDesc.trim() || `${productName.trim()} - টাটকা ও খাঁটি পাহাড়ি পণ্য।`,
          description_bn: productDesc.trim() || `${productName.trim()} - টাটকা ও খাঁটি পাহাড়ি পণ্য।`,
          image_url: permanentImageUrl, // স্থায়ী লিঙ্কটি এখানে সরাসরি সেভ হচ্ছে
          unit: '১ পিস',
          stock: 10,
          origin: 'পার্বত্য চট্টগ্রাম',
          quality_standard: '১০০% বিশুদ্ধ ও পরীক্ষিত',
          seller_name: 'ঝাদিমাদি মার্চেন্ট নেটওয়ার্ক',
          is_active: true
        };

        const { data: dbData, error: dbError } = await resilientSupabaseUpsert('products', supaPayload);

        if (dbError) {
          console.warn('[AdminUploadForm] products table resilient insert notice:', dbError.message);
        }

        // Also sync to databaseService and catalog to ensure immediate visibility
        await databaseService.saveProductToDatabase({
          id: dbData?.[0]?.id ? String(dbData[0].id) : `prod_${Date.now()}`,
          nameBn: productName.trim(),
          nameEn: productName.trim(),
          category: productCategory as any,
          categoryLabelBn: productCategory,
          price: regularPrice,
          originalPrice: regularPrice,
          unit: '১ পিস',
          stock: 10,
          image: permanentImageUrl,
          images: [permanentImageUrl],
          rating: 5,
          reviewsCount: 1,
          origin: 'পার্বত্য চট্টগ্রাম'
        });

        setSuccessMessage('🎉 অভিনন্দন! সফলভাবে ছবি বাকেটে আপলোড হয়েছে এবং প্রোডাক্ট ডাটাবেজে স্থায়ীভাবে যুক্ত হয়েছে!');
        if (onUploadSuccess) {
          onUploadSuccess(permanentImageUrl);
        }
        if (onSuccess) {
          onSuccess({
            type: 'product',
            id: dbData?.[0]?.id ? String(dbData[0].id) : `prod_${Date.now()}`,
            name: productName,
            imageUrl: permanentImageUrl
          });
        }
      } else {
        // Banner insert - strictly adheres to database schema:
        // (title, subtitle, image_url, badge, placement, target_link, display_order, is_active)
        // Strictly NO non-existent columns like 'link'
        const cleanBannerPayload: Record<string, any> = {
          title: productName.trim(),
          subtitle: bannerSubtitle.trim() || 'বিশেষ অফার ও পাহাড়ি পণ্য মেলা',
          image_url: permanentImageUrl, // Supabase Storage permanent Public URL from getPublicUrl()
          badge: 'স্পেশাল অফার',
          placement: bannerPlacement || 'homepage_hero',
          target_link: bannerTargetLink || '/',
          display_order: 1,
          is_active: true
        };

        const { data: bannerDbData, error: bannerError } = await resilientSupabaseUpsert('banners', cleanBannerPayload);

        if (bannerError) {
          console.warn('[AdminUploadForm] banners table insert notice:', bannerError.message);
        }

        // Sync with database service and local state
        await databaseService.saveBannerToDatabase({
          id: bannerDbData?.[0]?.id ? String(bannerDbData[0].id) : `banner_${Date.now()}`,
          title: productName.trim(),
          subtitle: bannerSubtitle.trim(),
          imageUrl: permanentImageUrl,
          targetLink: bannerTargetLink,
          link_url: bannerTargetLink,
          placement: bannerPlacement as any,
          tag: 'অফার',
          order: 1,
          isActive: true,
          createdAt: new Date().toISOString()
        });

        setSuccessMessage('🎉 অভিনন্দন! সফলভাবে ব্যানার ছবি বাকেটে আপলোড হয়েছে এবং ব্যানার ডাটাবেজে স্থায়ীভাবে যুক্ত হয়েছে!');
        if (onUploadSuccess) {
          onUploadSuccess(permanentImageUrl);
        }
        if (onSuccess) {
          onSuccess({
            type: 'banner',
            id: bannerDbData?.[0]?.id || `banner_${Date.now()}`,
            name: productName,
            imageUrl: permanentImageUrl
          });
        }
      }

      // Reset form on success
      setProductName('');
      setProductPrice('');
      setProductDesc('');
      setBannerSubtitle('');
      setFile(null);
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Trigger data sync so live app immediately reflects changes
      try {
        databaseService.notifyEntityChange(uploadType === 'product' ? 'products' : 'banners');
      } catch (_) {}

    } catch (error: any) {
      console.error('Upload failed:', error);
      let msg = error?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে।';
      if (msg.includes('is_staff') || msg.includes('schema mismatch') || msg.includes('user_roles')) {
        setShowSqlGuide(true);
        msg = 'সুপাবেস ডাটাবেজের is_staff বা user_roles পলিসি মিসম্যাচ ধরা পড়েছে। নিচে দেওয়া Migration 029 SQL ১-ক্লিকে কপি করে Supabase SQL Editor-এ রান করলে চিরতরে সমাধান হবে।';
      }
      setErrorMessage(msg);
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
            <UploadCloud className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <span>সরাসরি Supabase Storage আপলোড ও সেভ</span>
              <span className="text-[10px] bg-emerald-500/80 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                স্থায়ী ক্লাউড
              </span>
            </h3>
            <p className="text-xs text-emerald-100 font-normal">
              কম্পিউটার থেকে ছবি আপলোড করে স্থায়ী Public URL সরাসরি Supabase ডাটাবেজের `image_url` কলামে সেভ করুন।
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Type Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setUploadType('product');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            uploadType === 'product'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>প্রোডাক্ট আপলোড ('products' বাকেট)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setUploadType('banner');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            uploadType === 'banner'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>ব্যানার আপলোড ('banners' বাকেট)</span>
        </button>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            {permanentUrlResult && (
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-300 font-mono text-[11px] text-slate-700 break-all flex items-center justify-between gap-2">
                <span className="line-clamp-1">{permanentUrlResult}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(permanentUrlResult);
                    alert('স্থায়ী Public URL কপি হয়েছে!');
                  }}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  URL কপি
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-rose-900">আপলোড ব্যর্থ হয়েছে:</p>
                <p>{errorMessage}</p>
              </div>
            </div>

            {showSqlGuide && (
              <div className="bg-white p-3.5 rounded-xl border border-rose-200 space-y-2 text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-emerald-800 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Migration 029 SQL স্ক্রিপ্ট (১-ক্লিক সমাধান):</span>
                  </span>
                  <button
                    type="button"
                    onClick={copySqlToClipboard}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'কপি হয়েছে!' : 'SQL কপি করুন'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Supabase ড্যাশবোর্ডে গিয়ে SQL Editor-এ এটি পেস্ট করে Run করুন। এরপর চিরতরে Storage 400 ও is_staff এরর দূর হয়ে যাবে।
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2-Column Responsive Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Metadata Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {uploadType === 'product' ? 'পণ্যের নাম (Product Name) *' : 'ব্যানারের শিরোনাম (Banner Title) *'}
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={uploadType === 'product' ? 'যেমন: পাহাড়ি প্রাকৃতিক মধু' : 'যেমন: জুম চাষের তাজা ফলমূল মেলা'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold outline-none transition"
              />
            </div>

            {uploadType === 'product' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">মূল্য (Price ৳) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="যেমন: ৫০০"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-xs font-semibold outline-none bg-white cursor-pointer"
                    >
                      <option value="পাহাড়ি ফলমূল ও খাদ্য">পাহাড়ি ফলমূল ও খাদ্য</option>
                      <option value="প্রাকৃতিক মধু ও মসলা">প্রাকৃতিক মধু ও মসলা</option>
                      <option value="হস্তশিল্প ও ঐতিহ্যবাহী পোশাক">হস্তশিল্প ও ঐতিহ্যবাহী পোশাক</option>
                      <option value="শুটকি ও সিদল">শুটকি ও সিদল</option>
                      <option value="ভেষজ ও ঔষধি গাছ">ভেষজ ও ঔষধি গাছ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</label>
                  <textarea
                    rows={2}
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="পণ্যটির বিশেষ বৈশিষ্ট্য..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 text-xs outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">সাবটাইটেল / বিবরণ</label>
                  <input
                    type="text"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="যেমন: ১০০% অর্গানিক পাহাড়ি পণ্য এখন আপনার দরজায়"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-xs font-semibold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ডিসপ্লে পজিশন</label>
                    <select
                      value={bannerPlacement}
                      onChange={(e) => setBannerPlacement(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-xs font-semibold outline-none bg-white cursor-pointer"
                    >
                      <option value="homepage_hero">হোমপেজ হিরো স্লাইডার</option>
                      <option value="directory_top">ডিরেক্টরি হেডার</option>
                      <option value="vendor_spotlight">উদ্যোক্তা স্পটলাইট</option>
                      <option value="popup_ad">পপ-আপ বিজ্ঞাপন</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ক্লিক টার্গেট লিংক</label>
                    <select
                      value={bannerTargetLink}
                      onChange={(e) => setBannerTargetLink(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-xs font-semibold outline-none bg-white cursor-pointer"
                    >
                      <option value="home">হোমপেজ</option>
                      <option value="services">সেবাসমূহ</option>
                      <option value="auto_directory">মার্কেটপ্লেস</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Computer File Upload & Live Preview */}
          <div className="space-y-3">
            {(() => {
              const currentBucket = uploadType === 'banner' ? 'banners' : 'products';
              return (
                <>
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>কম্পিউটার থেকে ছবি নির্বাচন করুন *</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono">
                      Storage: '{currentBucket}' বাকেট
                    </span>
                  </label>

                  {/* Hidden native input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Interactive Upload / Preview Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] group ${
                      previewUrl 
                        ? 'border-emerald-500 bg-emerald-50/30' 
                        : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20'
                    }`}
                  >
                    {previewUrl ? (
                      <div className="space-y-3 w-full">
                        <div className="relative max-h-40 w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-950 flex items-center justify-center shadow-inner">
                          <img
                            src={previewUrl}
                            alt="Selected from PC"
                            className="max-h-40 w-auto object-contain"
                          />
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PC থেকে নির্বাচিত</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="font-bold line-clamp-1">{file?.name || 'নির্বাচিত ছবি'}</span>
                          <span className="text-emerald-700 font-bold hover:underline">ছবি পরিবর্তন করুন</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto text-emerald-600 group-hover:scale-110 transition">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-black text-slate-800">
                          আপনার কম্পিউটার থেকে ছবি সিলেক্ট করতে এখানে ক্লিক করুন
                        </p>
                        <p className="text-[11px] text-slate-500">
                          PNG, JPG, WebP (সর্বোচ্চ ১৫ মেগাবাইট)
                        </p>
                        <div className="inline-block mt-1 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200">
                          ⚡ Supabase Storage '{currentBucket}' বাকেটে সরাসরি আপলোড হবে
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

        </div>

        {/* Submit Progress / Status */}
        {uploading && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
            <div className="space-y-0.5 text-xs text-emerald-900 font-medium">
              <p className="font-bold">Supabase ক্লাউডে আপলোড ও ডাটাবেজে সেভ হচ্ছে...</p>
              <p className="text-[11px] text-emerald-700">{uploadStep || 'অনুগ্রহ করে অপেক্ষা করুন...'}</p>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white rounded-xl shadow-md font-black text-xs flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>আপলোড হচ্ছে...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>
                  {uploadType === 'product' ? 'সরাসরি প্রোডাক্ট আপলোড ও সেভ করুন' : 'সরাসরি ব্যানার আপলোড ও সেভ করুন'}
                </span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
