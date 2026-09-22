import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Database, 
  UploadCloud, 
  Search, 
  Check, 
  X, 
  RefreshCw, 
  Image as ImageIcon, 
  Link2, 
  Layers, 
  AlertCircle,
  ExternalLink,
  Tag,
  CheckCircle2,
  FolderOpen,
  Trash2
} from 'lucide-react';
import { supabaseMediaService, SupabaseMediaItem } from '../../services/supabaseMediaService';
import { isSupabaseConfigured } from '../../supabase';
import { NO_IMAGE_AVAILABLE_ICON } from '../../constants/imageConstants';

interface SupabaseMediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedUrls: string[]) => void;
  currentSelected?: string[];
  initialSelectedUrls?: string[];
  multiple?: boolean;
  allowMultiple?: boolean;
  title?: string;
  categoryHint?: string;
  productId?: string;
  onShowToast?: (msg: string) => void;
}

export const SupabaseMediaPickerModal: React.FC<SupabaseMediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSelected = [],
  initialSelectedUrls,
  multiple = true,
  allowMultiple,
  title = 'Supabase ডাটাবেজ ইমেজ পিকার ও মিডিয়া লাইব্রেরি',
  categoryHint = 'all',
  productId,
  onShowToast
}) => {
  const effectiveMultiple = allowMultiple !== undefined ? allowMultiple : multiple;
  const effectiveInitial = initialSelectedUrls || currentSelected;
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library');
  const [mediaItems, setMediaItems] = useState<SupabaseMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryHint || 'all');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<SupabaseMediaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SupabaseMediaItem | null>(null);

  // Upload Tab State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // URL Tab State
  const [customUrl, setCustomUrl] = useState('');

  // Sync initial selection
  useEffect(() => {
    if (isOpen) {
      const initial = (effectiveInitial || []).filter(Boolean);
      setSelectedUrls(initial);
      loadMedia(false);
    }
  }, [isOpen]);

  const loadMedia = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      const items = await supabaseMediaService.fetchStoredMedia({ forceRefresh });
      setMediaItems(items);
    } catch (err) {
      console.error('[SupabaseMediaPicker] Failed to load media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered media by search and category
  const filteredMedia = useMemo(() => {
    let list = [...mediaItems];

    if (selectedCategory && selectedCategory !== 'all') {
      const cat = selectedCategory.toLowerCase();
      list = list.filter(item => {
        const itemCat = (item.category || '').toLowerCase();
        if (cat === 'spicesgrains' || cat === 'food') {
          return ['food', 'spicesgrains', 'organic', 'grain'].includes(itemCat);
        }
        return itemCat === cat;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) ||
        (item.productName && item.productName.toLowerCase().includes(q)) ||
        (item.productCode && item.productCode.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        item.url.toLowerCase().includes(q)
      );
    }

    return list;
  }, [mediaItems, selectedCategory, searchQuery]);

  const toggleSelect = (url: string) => {
    if (effectiveMultiple) {
      if (selectedUrls.includes(url)) {
        setSelectedUrls(selectedUrls.filter(u => u !== url));
      } else {
        setSelectedUrls([...selectedUrls, url]);
      }
    } else {
      setSelectedUrls([url]);
    }
  };

  const handleConfirm = () => {
    if (selectedUrls.length > 0) {
      onSelect(selectedUrls);
      onClose();
    }
  };

  /**
   * Permanently deletes image from Supabase database and storage,
   * with immediate UI state refresh (removes card without page reload).
   */
  const executeDelete = async (item: SupabaseMediaItem) => {
    if (!item || !item.url) return;
    setDeletingId(item.id);
    try {
      const res = await supabaseMediaService.deleteMediaItem(item);
      if (res.success) {
        // Immediate UI refresh: remove from displayed media items
        setMediaItems(prev => prev.filter(m => m.id !== item.id && m.url !== item.url));
        // If image was selected, remove from selected list
        setSelectedUrls(prev => prev.filter(u => u !== item.url));
        if (onShowToast) {
          onShowToast('✓ ছবিটি ডাটাবেজ ও ক্লাউড স্টোরেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে');
        }
      } else {
        if (onShowToast) {
          onShowToast(res.error || 'ছবি মোছা সম্ভব হয়নি');
        }
      }
    } catch (err: any) {
      console.error('[SupabaseMediaPicker] Delete error:', err);
      if (onShowToast) {
        onShowToast('ছবি মোছার সময় অপ্রত্যাশিত ত্রুটি হয়েছে');
      }
    } finally {
      setDeletingId(null);
      setDeleteConfirmItem(null);
    }
  };

  // Upload handler for uploading directly to Supabase Storage
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadError(null);
    setIsUploading(true);
    const newUploadedUrls: string[] = [];
    const errors: string[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgressText(`Supabase ক্লাউডে আপলোড হচ্ছে... (${i + 1}/${fileArray.length})`);
        
        try {
          const result = await supabaseMediaService.uploadToSupabase(file, productId);
          if (result.success && result.url) {
            newUploadedUrls.push(result.url);
          } else {
            errors.push(result.error || `${file.name}: আপলোড ব্যর্থ হয়েছে`);
          }
        } catch (uploadItemErr: any) {
          errors.push(uploadItemErr?.message || `${file.name}: ছবি আপলোডে অপ্রত্যাশিত ত্রুটি`);
        }
      }

      if (errors.length > 0) {
        setUploadError(errors.join(' | '));
      }

      if (newUploadedUrls.length > 0) {
        await loadMedia(true);
        if (effectiveMultiple) {
          setSelectedUrls(prev => Array.from(new Set([...prev, ...newUploadedUrls])));
        } else {
          setSelectedUrls([newUploadedUrls[0]]);
        }
        setActiveTab('library');
      }
    } catch (err: any) {
      console.error('[SupabaseMediaPicker] Upload error:', err);
      setUploadError(err?.message || 'ছবি আপলোড প্রক্রিয়াকরণে সমস্যা হয়েছে');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      const url = customUrl.trim();
      if (effectiveMultiple) {
        setSelectedUrls(prev => [...prev, url]);
      } else {
        setSelectedUrls([url]);
      }
      setCustomUrl('');
      setActiveTab('library');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {title}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isSupabaseConfigured ? 'Supabase Live Connected' : 'Supabase Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Supabase Database ও Cloud Storage-এ সংরক্ষিত পণ্যের ছবি নির্বাচন ও সরাসরি আপলোড
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => loadMedia(true)}
              disabled={isLoading}
              title="ডাটাবেজ রিফ্রেশ করুন"
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-3 pb-0 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'library'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Supabase ডাটাবেজ গ্যালারি ({mediaItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>ক্লাউডে নতুন ছবি আপলোড করুন</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'url'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>সরাসরি ইমেজ লিংক / URL</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
          
          {/* TAB 1: SUPABASE DATABASE GALLERY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="পণ্যের নাম, কোড বা ছবি খুঁজুন..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[11px]">
                  {[
                    { id: 'all', label: 'সব ছবি' },
                    { id: 'Food', label: 'খাদ্য ও শস্য' },
                    { id: 'ShutkiSidol', label: 'শুটকি ও সিদোল' },
                    { id: 'CraftsHoney', label: 'মধু ও হস্তশিল্প' },
                    { id: 'Clothing', label: 'পোশাক' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  প্রদর্শিত হচ্ছে: <strong className="text-slate-800">{filteredMedia.length}</strong> টি ছবি
                </span>
                <span>
                  নির্বাচিত: <strong className="text-emerald-700">{selectedUrls.length}</strong> টি
                </span>
              </div>

              {/* Media Grid */}
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Supabase ডাটাবেজ থেকে ছবি লোড করা হচ্ছে...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl p-6 space-y-3">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">কোনো সংরক্ষিত ছবি পাওয়া যায়নি</p>
                  <p className="text-[11px] text-slate-500">
                    'ক্লাউডে নতুন ছবি আপলোড করুন' ট্যাবে গিয়ে সরাসরি Supabase-এ ছবি আপলোড করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    নতুন ছবি আপলোড করুন
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredMedia.map((item) => {
                    const isSelected = selectedUrls.includes(item.url);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelect(item.url)}
                        className={`group relative rounded-2xl overflow-hidden border-2 bg-white cursor-pointer transition shadow-2xs hover:shadow-md flex flex-col ${
                          isSelected
                            ? 'border-emerald-600 ring-2 ring-emerald-200 bg-emerald-50/20'
                            : 'border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        {/* Image Thumbnail */}
                        <div className="relative aspect-square bg-slate-100 overflow-hidden">
                          <img
                            src={item.url}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                            }}
                          />

                          {/* Permanent Delete / Remove Button (Trash Icon) */}
                          <button
                            type="button"
                            id={`btn-delete-media-${item.id}`}
                            title="স্থায়ীভাবে মুছুন (Permanent Delete)"
                            aria-label="ছবি মুছুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmItem(item);
                            }}
                            disabled={deletingId === item.id}
                            className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 active:scale-95 text-white shadow-md transition duration-150 cursor-pointer flex items-center justify-center border border-white/50 backdrop-blur-xs group/del"
                          >
                            {deletingId === item.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 stroke-[2.2] group-hover/del:scale-110 transition-transform" />
                            )}
                          </button>

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Source Tag */}
                          <div className="absolute bottom-1.5 left-1.5">
                            {item.source === 'supabase_storage' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 backdrop-blur-xs text-[9px] font-extrabold text-emerald-300 flex items-center gap-1 shadow-xs">
                                <Database className="w-2.5 h-2.5" />
                                Cloud Storage
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-xs text-[9px] font-extrabold text-slate-200 flex items-center gap-1 shadow-xs">
                                <Tag className="w-2.5 h-2.5 text-emerald-400" />
                                {item.productCode || 'Database'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Info */}
                        <div className="p-2 text-left space-y-0.5">
                          <p className="text-[11px] font-bold text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between text-[9.5px] text-slate-500">
                            <span>{item.category || 'পণ্য'}</span>
                            <span className="font-mono text-emerald-700 font-bold">
                              {isSelected ? '✓ নির্বাচিত' : '+ নির্বাচন'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD DIRECTLY TO SUPABASE */}
          {activeTab === 'upload' && (
            <div className="max-w-xl mx-auto py-4 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>সরাসরি Supabase Cloud Storage ইন্টিগ্রেশন:</span>
                </div>
                <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                  আপনার ডিভাইস থেকে নির্বাচিত ছবি সরাসরি <strong className="font-mono">Supabase Storage ('products' bucket)</strong>-এ আপলোড হবে এবং স্বয়ংক্রিয়ভাবে একটি স্থায়ী পাবলিক ক্লাউড CDN লিংক হিসেবে ডাটাবেজে যুক্ত হবে।
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleUploadFiles(e.target.files);
                  }
                }}
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    handleUploadFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition select-none ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/20'
                }`}
              >
                {isUploading ? (
                  <div className="py-6 space-y-3">
                    <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-800">{uploadProgressText}</p>
                    <p className="text-xs text-slate-500">অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto text-emerald-600">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Supabase ক্লাউডে আপলোড করতে ছবি নির্বাচন করুন
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ক্লিক করুন অথবা ড্র্যাগ অ্যান্ড ড্রপ করুন (PNG, JPG, WebP)
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10.5px] text-slate-500">
                      <span>সর্বোচ্চ ১৫ মেগাবাইট</span>
                      <span>•</span>
                      <span>একাধিক ছবি সাপোর্ট করে</span>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIRECT IMAGE URL */}
          {activeTab === 'url' && (
            <div className="max-w-xl mx-auto py-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  সরাসরি ইমেজ লিংক (Supabase বা অন্য যেকোনো ভেরিফায়েড CDN লিংক):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://dwhsqftllkximhfvwqak.supabase.co/storage/v1/object/public/..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    disabled={!customUrl.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    যুক্ত করুন
                  </button>
                </div>
              </div>

              {customUrl && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <span className="text-[11px] text-slate-500 font-bold block">লাইভ প্রিভিউ:</span>
                  <img
                    src={customUrl}
                    alt="Preview"
                    className="w-40 h-40 object-cover rounded-xl mx-auto border border-slate-200 shadow-2xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full sm:w-auto justify-between sm:justify-start">
            <span>
              নির্বাচিত ছবি: <strong className="text-emerald-700">{selectedUrls.length}</strong> টি
            </span>
            {selectedUrls.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedUrls([])}
                className="text-rose-600 hover:underline text-[11px] font-medium cursor-pointer"
              >
                সব বাদ দিন
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#16a34a] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>✓ ছবি নিশ্চিত করুন ({selectedUrls.length})</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirmItem && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7 stroke-[2.2]" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900">ছবি মুছে ফেলতে চান?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  এই ছবিটি Supabase ডাটাবেজ এবং ক্লাউড স্টোরেজ থেকে চিরতরে মুছে ফেলা হবে। এটি পরবর্তীতে আর ফিরিয়ে আনা সম্ভব হবে না।
                </p>
              </div>

              {/* Preview of item to delete */}
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                <img
                  src={deleteConfirmItem.url}
                  alt={deleteConfirmItem.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{deleteConfirmItem.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {deleteConfirmItem.source === 'supabase_storage' ? 'Supabase Storage Bucket' : 'Supabase Database Table'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  disabled={deletingId === deleteConfirmItem.id}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  id="confirm-permanent-delete-btn"
                  onClick={() => executeDelete(deleteConfirmItem)}
                  disabled={deletingId === deleteConfirmItem.id}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  {deletingId === deleteConfirmItem.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>মুছে ফেলা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>হ্যাঁ, মুছে ফেলুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SupabaseMediaPickerModal;
