import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Plus, Search, CheckCircle2, XCircle, Trash2, 
  Edit3, Eye, Sparkles, MapPin, Phone, Tag, Calendar, User, 
  Check, X, AlertCircle, RefreshCw, Send, UploadCloud, 
  Image as ImageIcon, Loader2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { FeedPost } from '../../types';
import { supabaseMediaService } from '../../services/supabaseMediaService';
import { SupabaseMediaPickerModal } from './SupabaseMediaPickerModal';

interface AdminPostsTabProps {
  onShowToast: (msg: string) => void;
}

export const AdminPostsTab: React.FC<AdminPostsTabProps> = ({ onShowToast }) => {
  const { 
    posts, 
    addPost, 
    updatePost, 
    deletePost, 
    approvePost, 
    rejectPost,
    setActiveDraftPreview 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Approved' | 'Pending' | 'Rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);

  // Supabase Storage & Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSupabasePickerOpen, setIsSupabasePickerOpen] = useState(false);

  // Post form state
  const [form, setForm] = useState({
    title: '',
    authorName: 'ঝাদিমাদি অ্যাডমিন',
    authorRole: 'Admin' as 'User' | 'Provider' | 'Admin',
    postType: 'General' as 'Service' | 'Property' | 'ECommerce' | 'NeedWork' | 'General',
    category: 'জরুরি নোটিশ ও সেবা',
    division: 'চট্টগ্রাম',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    mahalla: '',
    price: '',
    realPhone: '01812345678',
    content: '',
    image: '',
    status: 'Approved' as 'Pending' | 'Approved' | 'Rejected'
  });

  // Real-time live draft broadcasting to mobile preview monitor
  useEffect(() => {
    if (isCreating || editingPost) {
      setActiveDraftPreview({
        type: 'post',
        data: {
          ...form,
          id: editingPost ? editingPost.id : 'preview_draft_post',
          price: form.price ? Number(form.price) : undefined,
          createdAt: 'লাইভ ড্রাফট...',
          likes: editingPost ? editingPost.likes : 0,
          commentsCount: editingPost ? editingPost.commentsCount : 0
        }
      });
    } else {
      setActiveDraftPreview(null);
    }
    return () => {
      setActiveDraftPreview(null);
    };
  }, [form, isCreating, editingPost, setActiveDraftPreview]);

  const startNewPost = () => {
    setEditingPost(null);
    setForm({
      title: '',
      authorName: 'ঝাদিমাদি অ্যাডমিন',
      authorRole: 'Admin',
      postType: 'General',
      category: 'জরুরি নোটিশ ও সেবা',
      division: 'চট্টগ্রাম',
      district: 'খাগড়াছড়ি',
      upazila: 'খাগড়াছড়ি সদর',
      mahalla: '',
      price: '',
      realPhone: '01812345678',
      content: '',
      image: '',
      status: 'Approved'
    });
    setIsCreating(true);
  };

  const startEditPost = (p: FeedPost) => {
    setEditingPost(p);
    setForm({
      title: p.title || '',
      authorName: p.authorName || '',
      authorRole: p.authorRole || 'User',
      postType: p.postType || 'General',
      category: p.category || '',
      division: p.division || 'চট্টগ্রাম',
      district: p.district || 'খাগড়াছড়ি',
      upazila: p.upazila || 'খাগড়াছড়ি সদর',
      mahalla: p.mahalla || '',
      price: p.price ? String(p.price) : '',
      realPhone: p.realPhone || '01700000000',
      content: p.content || '',
      image: p.image || '',
      status: p.status || 'Approved'
    });
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingPost(null);
    setActiveDraftPreview(null);
  };

  // Handle direct file upload to Supabase Cloud Storage
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const res = await supabaseMediaService.uploadToSupabase(file, editingPost?.id);
      if (res.success && res.url) {
        setForm(prev => ({ ...prev, image: res.url }));
        onShowToast('⚡ Supabase ক্লাউড স্টোরেজে ছবি সফলভাবে আপলোড সম্পন্ন!');
      } else {
        setUploadError(res.error || 'ছবি আপলোড করতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      setUploadError(err.message || 'আপলোড ব্যর্থ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      onShowToast('❌ পোস্টের শিরোনাম প্রদান করুন');
      return;
    }
    if (!form.content.trim()) {
      onShowToast('❌ পোস্টের বিবরণ লিখুন');
      return;
    }

    if (editingPost) {
      updatePost(editingPost.id, {
        title: form.title.trim(),
        authorName: form.authorName.trim(),
        authorRole: form.authorRole,
        postType: form.postType,
        category: form.category.trim(),
        division: form.division,
        district: form.district,
        upazila: form.upazila,
        mahalla: form.mahalla.trim(),
        price: form.price ? Number(form.price) : undefined,
        realPhone: form.realPhone.trim(),
        contactPhoneHidden: `${form.realPhone.trim().slice(0, 5)}XX-XXX`,
        content: form.content.trim(),
        image: form.image.trim() || undefined,
        status: form.status
      });
      onShowToast('✅ পোস্ট সফলভাবে আপডেট করা হয়েছে এবং প্রিভিউতে সিঙ্ক হয়েছে!');
    } else {
      addPost({
        title: form.title.trim(),
        authorName: form.authorName.trim() || 'ঝাদিমাদি অ্যাডমিন',
        authorRole: form.authorRole,
        postType: form.postType,
        category: form.category.trim() || 'সাধারণ',
        division: form.division,
        district: form.district,
        upazila: form.upazila,
        mahalla: form.mahalla.trim(),
        price: form.price ? Number(form.price) : undefined,
        realPhone: form.realPhone.trim(),
        contactPhoneHidden: `${form.realPhone.trim().slice(0, 5)}XX-XXX`,
        content: form.content.trim(),
        image: form.image.trim() || undefined,
        status: form.status,
        createdAt: 'এখনই',
        likes: 1,
        commentsCount: 0
      });
      onShowToast('✅ নতুন পোস্ট সফলভাবে পাবলিশ ও সিঙ্ক করা হয়েছে!');
    }

    setIsCreating(false);
    setEditingPost(null);
    setActiveDraftPreview(null);
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.realPhone && p.realPhone.includes(searchTerm)) ||
      (p.district && p.district.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.postType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              কমিউনিটি ফিড ও পোস্ট ম্যানেজমেন্ট
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              মোট {posts.length}টি পোস্ট
            </span>
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
              রিয়েল-টাইম লাইভ সিঙ্ক
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            পাহাড়ি এলাকার স্থানীয় সেবা, প্রপার্টি, পণ্য ও কাজের পোস্ট পরিচালনা করুন। যেকোনো পরিবর্তনে মোবাইল প্রিভিউ সাথে সাথে আপডেট হবে।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCreating ? (
            <button
              onClick={startNewPost}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন পোস্ট তৈরি করুন</span>
            </button>
          ) : (
            <button
              onClick={cancelForm}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>তালিকায় ফিরুন</span>
            </button>
          )}
        </div>
      </div>

      {/* CREATE / EDIT FORM */}
      {isCreating && (
        <form onSubmit={handleSavePost} className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {editingPost ? 'পোস্ট এডিট করুন' : 'নতুন পোস্ট তৈরি করুন'}
              <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                (টাইপ করার সাথে সাথে বামের মোবাইল প্রিভিউতে লাইভ আপডেট দেখা যাবে)
              </span>
            </h2>
            <button
              type="button"
              onClick={cancelForm}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                পোস্টের শিরোনাম *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="যেমন: খাগড়াছড়িতে অভিজ্ঞ ইলেকট্রিশিয়ান সার্ভিস"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                পোস্টের ধরন (Post Type)
              </label>
              <select
                value={form.postType}
                onChange={e => setForm({ ...form, postType: e.target.value as any })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="General">📢 সাধারণ বিজ্ঞপ্তি ও পোস্ট (General)</option>
                <option value="Service">🛠️ সেবা ও সার্ভিস (Service)</option>
                <option value="Property">🏠 প্রপার্টি ও জমিজমা (Property)</option>
                <option value="ECommerce">🛒 পণ্য ও কেনাবেচা (ECommerce)</option>
                <option value="NeedWork">💼 কাজের লোক প্রয়োজন (NeedWork)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                লেখকের নাম
              </label>
              <input
                type="text"
                value={form.authorName}
                onChange={e => setForm({ ...form, authorName: e.target.value })}
                placeholder="পোস্টকারী ব্যক্তির নাম"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                যোগাযোগের মোবাইল নম্বর
              </label>
              <input
                type="text"
                value={form.realPhone}
                onChange={e => setForm({ ...form, realPhone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                জেলা ও উপজেলা
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="খাগড়াছড়ি">খাগড়াছড়ি</option>
                  <option value="রাঙ্গামাটি">রাঙ্গামাটি</option>
                  <option value="বান্দরবান">বান্দরবান</option>
                  <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                </select>
                <input
                  type="text"
                  value={form.upazila}
                  onChange={e => setForm({ ...form, upazila: e.target.value })}
                  placeholder="উপজেলা (যেমন: সদর)"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মূল্য / ফি (ঐচ্ছিক)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="টাকার পরিমাণ (যেমন: ৫০০)"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              পোস্টের বিস্তারিত বিবরণ *
            </label>
            <textarea
              required
              rows={3}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="পোস্টের সম্পূর্ণ বিবরণ ও তথ্যাদি এখানে লিখুন..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                পোস্টের ছবি (Supabase Cloud Storage)
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ক্লাউড স্টোরেজ লাইভ
              </span>
            </label>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFile}
              className="hidden"
            />

            {/* Image Preview or Upload Buttons */}
            {form.image ? (
              <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                <img 
                  src={form.image} 
                  alt="Post preview" 
                  className="w-full h-36 object-cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    ছবি পরিবর্তন
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    মুছে ফেলুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>সুপাবেসে আপলোড হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>সরাসরি ছবি আপলোড করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSupabasePickerOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>সুপাবেস গ্যালারি থেকে বাছুন</span>
                </button>
              </div>
            )}

            {uploadError && (
              <p className="text-[11px] text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {uploadError}
              </p>
            )}

            <input
              type="text"
              value={form.image}
              onChange={e => setForm({ ...form, image: e.target.value })}
              placeholder="অথবা সরাসরি ইমেজ URL পেস্ট করুন (https://...)"
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status === 'Approved'}
                  onChange={e => setForm({ ...form, status: e.target.checked ? 'Approved' : 'Pending' })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>তাৎক্ষণিক লাইভ প্রকাশ করুন (Auto Approved)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{editingPost ? 'আপডেট সেভ করুন' : 'পাবলিশ ও সিঙ্ক করুন'}</span>
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
              placeholder="পোস্টের শিরোনাম, বিবরণ বা ফোন খুঁজুন..."
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
            প্রদর্শিত হচ্ছে: <strong className="text-slate-800">{filteredPosts.length}</strong>টি পোস্ট
          </div>
        </div>

        {/* Status & Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            সব পোস্ট ({posts.length})
          </button>
          <button
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${statusFilter === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            লাইভ অনুমোদিত ({posts.filter(p => p.status === 'Approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${statusFilter === 'Pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            অপেক্ষমাণ ({posts.filter(p => p.status === 'Pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('Rejected')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${statusFilter === 'Rejected' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            প্রত্যাখ্যাত ({posts.filter(p => p.status === 'Rejected').length})
          </button>
        </div>
      </div>

      {/* POSTS LIST / CARDS */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-sm">কোনো পোস্ট পাওয়া যায়নি</p>
          <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে সার্চ বা ফিল্টার পরিবর্তন করুন অথবা নতুন পোস্ট যুক্ত করুন।</p>
          <button
            onClick={startNewPost}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন পোস্ট লিখুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Card Top Row: Type & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {post.postType === 'Service' ? '🛠️ সেবা' : post.postType === 'Property' ? '🏠 প্রপার্টি' : post.postType === 'ECommerce' ? '🛒 কেনাবেচা' : post.postType === 'NeedWork' ? '💼 কাজ চাই' : '📢 সাধারণ'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {post.status === 'Approved' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> অনুমোদিত
                      </span>
                    )}
                    {post.status === 'Pending' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> অপেক্ষমাণ
                      </span>
                    )}
                    {post.status === 'Rejected' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> প্রত্যাখ্যাত
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                  {post.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                  {post.content}
                </p>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{post.authorName} ({post.authorRole})</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{post.district}{post.upazila ? `, ${post.upazila}` : ''}</span>
                  </div>
                  {post.price && (
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <span>৳</span>
                      <span>{post.price.toLocaleString('bn-BD')} টাকা</span>
                    </div>
                  )}
                  {post.realPhone && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{post.realPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {post.status !== 'Approved' && (
                    <button
                      onClick={() => {
                        approvePost(post.id);
                        onShowToast('✅ পোস্ট অনুমোদিত হয়েছে ও লাইভ সিঙ্ক সম্পন্ন!');
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="অনুমোদন করুন"
                    >
                      <Check className="w-3 h-3" /> অনুমোদন
                    </button>
                  )}
                  {post.status !== 'Rejected' && (
                    <button
                      onClick={() => {
                        rejectPost(post.id);
                        onShowToast('⚠️ পোস্ট স্থগিত/বাতিল করা হয়েছে!');
                      }}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="বাতিল করুন"
                    >
                      <X className="w-3 h-3" /> বাতিল
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEditPost(post)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="এডিট করুন"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`আপনি কি নিশ্চিতভাবে "${post.title}" পোস্টটি মুছে ফেলতে চান?`)) {
                        deletePost(post.id);
                        onShowToast('🗑️ পোস্ট স্থায়ীভাবে মুছে ফেলা হয়েছে!');
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supabase Media Gallery Picker Modal */}
      <SupabaseMediaPickerModal
        isOpen={isSupabasePickerOpen}
        onClose={() => setIsSupabasePickerOpen(false)}
        onSelect={(urls) => {
          if (urls.length > 0) {
            setForm(prev => ({ ...prev, image: urls[0] }));
            onShowToast('⚡ Supabase স্টোরেজ থেকে ছবি যুক্ত করা হয়েছে!');
          }
        }}
        multiple={false}
      />
    </div>
  );
};
