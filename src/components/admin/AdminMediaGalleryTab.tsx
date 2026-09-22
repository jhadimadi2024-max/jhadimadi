import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  Layers, 
  Package, 
  Sparkles, 
  Filter, 
  FolderPlus,
  Eye,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Database,
  ArrowUpRight,
  X
} from 'lucide-react';
import { supabaseMediaService, SupabaseMediaItem, KNOWN_STORAGE_BUCKETS } from '../../services/supabaseMediaService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

interface AdminMediaGalleryTabProps {
  onUseInProduct?: (imageUrl: string) => void;
  onUseInBanner?: (imageUrl: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminMediaGalleryTab: React.FC<AdminMediaGalleryTabProps> = ({
  onUseInProduct,
  onUseInBanner,
  onShowToast
}) => {
  const [mediaList, setMediaList] = useState<SupabaseMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'storage' | 'db_product' | 'db_banner'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload State
  const [uploadBucket, setUploadBucket] = useState<string>('products');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Detail Modal
  const [inspectItem, setInspectItem] = useState<SupabaseMediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Load Media
  const loadMedia = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const items = await supabaseMediaService.fetchStoredMedia({
        bucket: selectedBucket !== 'all' ? selectedBucket : undefined,
        forceRefresh
      });
      setMediaList(items);
    } catch (err) {
      console.error('Failed to load storage gallery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia(false);
  }, [selectedBucket]);

  // Copy helper with feedback
  const handleCopyUrl = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    if (onShowToast) {
      onShowToast('📋 স্থায়ী Public URL ক্লিপবোর্ডে কপি করা হয়েছে!');
    }
    setTimeout(() => {
      setCopiedUrl(null);
    }, 2500);
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(`'${uploadBucket}' বাকেটে আপলোড হচ্ছে...`);
    setUploadError(null);

    try {
      const result = await supabaseMediaService.uploadToSupabase(file, { bucket: uploadBucket });
      if (result.success && result.url) {
        if (onShowToast) {
          onShowToast(`✅ '${uploadBucket}' বাকেটে ছবি সফলভাবে আপলোড হয়েছে!`);
        }
        await loadMedia(true);
        if (result.item) {
          setInspectItem(result.item);
        }
      } else {
        setUploadError(result.error || 'আপলোড ব্যর্থ হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      setUploadError(err.message || 'আপলোড প্রক্রিয়ায় ত্রুটি হয়েছে।');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete media item
  const handleDeleteItem = async (item: SupabaseMediaItem) => {
    if (!window.confirm(`আপনি কি এই ছবিটি (${item.name}) বাকেট গ্যালারি থেকে মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      await supabaseMediaService.deleteMediaItem(item);
      setMediaList(prev => prev.filter(m => m.id !== item.id && m.url !== item.url));
      if (inspectItem?.id === item.id) {
        setInspectItem(null);
      }
      if (onShowToast) {
        onShowToast('🗑️ ছবিটি সফলভাবে মুছে ফেলা হয়েছে।');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      if (onShowToast) {
        onShowToast('⚠️ ডিলিট সম্পন্ন করা যায়নি।');
      }
    }
  };

  // Filter items
  const filteredList = mediaList.filter(item => {
    // 1. Source filter
    if (sourceFilter === 'storage' && item.source !== 'supabase_storage') return false;
    if (sourceFilter === 'db_product' && item.source !== 'supabase_db_product') return false;
    if (sourceFilter === 'db_banner' && item.source !== 'supabase_db_banner') return false;

    // 2. Bucket filter
    if (selectedBucket !== 'all') {
      if ((item.bucket || '').toLowerCase() !== selectedBucket.toLowerCase()) return false;
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchProd = (item.productName || '').toLowerCase().includes(q);
      const matchBan = (item.bannerTitle || '').toLowerCase().includes(q);
      const matchUrl = (item.url || '').toLowerCase().includes(q);
      const matchBucket = (item.bucket || '').toLowerCase().includes(q);
      if (!matchName && !matchProd && !matchBan && !matchUrl && !matchBucket) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" /> Supabase Storage Buckets
            </span>
            {isSupabaseConfigured && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ক্লাউড সংযুক্ত
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            মিডিয়া লাইব্রেরি ও বাকেট গ্যালারি
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            সুপাবেস স্টোরেজ বাকেট ও ডাটাবেজের সকল ইমেজ থাম্বনেইল দেখুন, সরাসরি নতুন ছবি আপলোড করুন এবং পণ্য বা ব্যানারে পার্মানেন্ট পাবলিক URL ব্যবহার করুন।
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadMedia(true)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            রিফ্রেশ
          </button>
          <label className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-emerald-600/20">
            <UploadCloud className="w-4 h-4" />
            সরাসরি ছবি আপলোড
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Upload Banner / Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">টার্গেট স্টোরেজ বাকেট নির্বাচন</h2>
              <p className="text-xs text-slate-500">নতুন ফাইল আপলোড করার জন্য কাঙ্ক্ষিত বাকেট বেছে নিন</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">বাকেট:</span>
            <select
              value={uploadBucket}
              onChange={(e) => setUploadBucket(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden text-slate-800"
            >
              <option value="products">products (পণ্য গ্যালারি)</option>
              <option value="banners">banners (ব্যানার ও অফার)</option>
              <option value="avatars">avatars (প্রোফাইল ছবি)</option>
              <option value="business-media">business-media (দোকান ও ব্যবসা)</option>
              <option value="service-media">service-media (সার্ভিস ও সেবা)</option>
            </select>
          </div>
        </div>

        {uploadProgress && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            {uploadProgress}
          </div>
        )}

        {uploadError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {uploadError}
          </div>
        )}
      </div>

      {/* Bucket Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Bucket Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedBucket('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedBucket === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            সকল বাকেট ({mediaList.length})
          </button>
          {KNOWN_STORAGE_BUCKETS.map(bName => {
            const count = mediaList.filter(m => (m.bucket || '').toLowerCase() === bName.toLowerCase()).length;
            return (
              <button
                key={bName}
                onClick={() => setSelectedBucket(bName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  selectedBucket === bName
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <HardDrive className="w-3 h-3" />
                {bName} {count > 0 && <span className="opacity-80">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Search & Source Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ছবির নাম, প্রোডাক্টের নাম, ব্যানার বা URL দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:outline-hidden text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-slate-700"
            >
              <option value="all">উৎস: সকল উৎস</option>
              <option value="storage">সুপাবেস ক্লাউড স্টোরেজ</option>
              <option value="db_product">পণ্য ক্যাটালগ ডাটাবেজ</option>
              <option value="db_banner">ব্যানার ডাটাবেজ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Thumbnails */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(12)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-2 space-y-2 animate-pulse">
              <div className="aspect-square bg-slate-200 rounded-xl"></div>
              <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
              <div className="h-2 bg-slate-100 rounded-md w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">কোনো ইমেজ পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              নির্বাচিত ফিল্টার বা সার্চে কোনো ছবি পাওয়া যায়নি। আপনি ওপরের বাটন দিয়ে সরাসরি সুপাবেস বাকেটে ছবি আপলোড করতে পারেন।
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm">
            <UploadCloud className="w-4 h-4" />
            এখনই ছবি আপলোড করুন
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredList.map((item) => {
            const isCopied = copiedUrl === item.url;
            return (
              <div 
                key={item.id} 
                className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Image Box */}
                <div 
                  className="aspect-square relative bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => setInspectItem(item)}
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[9.5px] font-bold truncate max-w-[85%]">
                      {item.bucket || 'products'}
                    </span>
                    {item.source === 'supabase_storage' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" title="সুপাবেস ক্লাউড স্টোরেজ" />
                    )}
                  </div>

                  {/* Hover Quick Action Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectItem(item);
                      }}
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-xs transition"
                      title="বিস্তারিত ও প্রিভিউ"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(item.url);
                      }}
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-xs transition"
                      title="Public URL কপি করুন"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Footer / Meta */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 truncate" title={item.name}>
                      {item.productName || item.bannerTitle || item.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.source === 'supabase_storage' ? 'ক্লাউড বাকেট' : item.source === 'supabase_db_banner' ? 'ব্যানার ডাটাবেজ' : 'পণ্য ডাটাবেজ'}
                    </p>
                  </div>

                  {/* Shortcut Buttons to apply directly to Product or Banner */}
                  <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                    {onUseInProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          onUseInProduct(item.url);
                          if (onShowToast) onShowToast('📦 পণ্যের ছবি হিসেবে সিলেক্ট করা হয়েছে!');
                        }}
                        className="flex-1 py-1 px-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition flex items-center justify-center gap-0.5 cursor-pointer"
                        title="এই ছবি দিয়ে নতুন পণ্য যোগ করুন"
                      >
                        <Package className="w-2.5 h-2.5" />
                        পণ্য
                      </button>
                    )}

                    {onUseInBanner && (
                      <button
                        type="button"
                        onClick={() => {
                          onUseInBanner(item.url);
                          if (onShowToast) onShowToast('🖼️ ব্যানারের ছবি হিসেবে সিলেক্ট করা হয়েছে!');
                        }}
                        className="flex-1 py-1 px-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold transition flex items-center justify-center gap-0.5 cursor-pointer"
                        title="এই ছবি দিয়ে নতুন ব্যানার তৈরি করুন"
                      >
                        <ImageIcon className="w-2.5 h-2.5" />
                        ব্যানার
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.url)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                      title="পাবলিক লিংক কপি করুন"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Item Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 truncate max-w-xs sm:max-w-md">
                    {inspectItem.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    বাকেট: <strong className="text-slate-700">{inspectItem.bucket || 'products'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="w-full max-h-72 rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800">
                <img
                  src={inspectItem.url}
                  alt={inspectItem.name}
                  className="max-h-72 max-w-full object-contain"
                />
              </div>

              {/* Public URL Box */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  স্থায়ী Public URL (image_url):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inspectItem.url}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 border border-slate-200 text-slate-700 truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(inspectItem.url)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    {copiedUrl === inspectItem.url ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        কপি হয়েছে!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        কপি করুন
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Destination Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {onUseInProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      onUseInProduct(inspectItem.url);
                      setInspectItem(null);
                      if (onShowToast) onShowToast('📦 পণ্যের ছবি হিসেবে সিলেক্ট করা হয়েছে!');
                    }}
                    className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Package className="w-4 h-4 text-emerald-600" />
                    পণ্য তৈরিতে ব্যবহার
                  </button>
                )}

                {onUseInBanner && (
                  <button
                    type="button"
                    onClick={() => {
                      onUseInBanner(inspectItem.url);
                      setInspectItem(null);
                      if (onShowToast) onShowToast('🖼️ ব্যানার তৈরিতে ব্যবহার করা হয়েছে!');
                    }}
                    className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <ImageIcon className="w-4 h-4 text-sky-600" />
                    ব্যানার তৈরিতে ব্যবহার
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <a
                href={inspectItem.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> ফুল রেজোলিউশনে দেখুন
              </a>

              <button
                type="button"
                onClick={() => handleDeleteItem(inspectItem)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> গ্যালারি থেকে মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
