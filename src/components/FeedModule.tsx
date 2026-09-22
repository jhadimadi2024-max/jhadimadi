import React, { useState } from 'react';
import { FeedPost, Language } from '../types';
import { 
  MessageSquare, ThumbsUp, ShieldCheck, Phone, Lock, Unlock, 
  Send, Plus, Filter, AlertCircle, CheckCircle2, Clock, MapPin, 
  User, Sparkles, Tag, Eye
} from 'lucide-react';

interface FeedModuleProps {
  posts: FeedPost[];
  onAddPost: (post: FeedPost) => void;
  onApprovePost: (postId: string) => void;
  onRejectPost: (postId: string) => void;
  onUnlockContact: (postId: string) => void;
  onSelectPost?: (post: FeedPost) => void;
  lang: Language;
  selectedDivision: string;
  selectedDistrict: string;
  selectedUpazila: string;
  selectedMahalla: string;
  openLocationModal: () => void;
}

export const FeedModule: React.FC<FeedModuleProps> = ({
  posts,
  onAddPost,
  onApprovePost,
  onRejectPost,
  onUnlockContact,
  onSelectPost,
  lang,
  selectedDivision,
  selectedDistrict,
  selectedUpazila,
  selectedMahalla,
  openLocationModal,
}) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const isActualAdmin = typeof window !== 'undefined' && 
    (sessionStorage.getItem('jhadimadi_admin_session') !== null || 
     sessionStorage.getItem('jhadimadi_super_admin_session') === 'true' ||
     Boolean(sessionStorage.getItem('jhadimadi_admin_token')));

  const handleToggleAdminMode = () => {
    if (!isActualAdmin) {
      return;
    }
    setIsAdminMode(prev => !prev);
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  
  // Create Post Form State
  const [postType, setPostType] = useState<FeedPost['postType']>('NeedWork');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ইলেকট্রিশিয়ান');
  const [price, setPrice] = useState<number | ''>('');
  const [phone, setPhone] = useState('01700000000');
  const [authorRole, setAuthorRole] = useState<'User' | 'Provider'>('User');
  const [authorName, setAuthorName] = useState('মোঃ ইউজার');

  const filteredPosts = posts.filter(post => {
    // If not admin, hide pending or rejected posts unless user created it
    if (!isAdminMode && post.status !== 'Approved') return false;
    
    if (selectedCategoryFilter !== 'All' && post.postType !== selectedCategoryFilter) {
      return false;
    }
    return true;
  });

  const pendingCount = posts.filter(p => p.status === 'Pending').length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newPost: FeedPost = {
      id: 'post_' + Date.now(),
      authorName: authorName || 'ইউজার',
      authorRole,
      postType,
      title,
      content,
      division: selectedDivision,
      district: selectedDistrict,
      upazila: selectedUpazila,
      mahalla: selectedMahalla,
      category,
      price: price ? Number(price) : undefined,
      contactPhoneHidden: phone ? phone.slice(0, 5) + 'XX-XXX' + phone.slice(-3) : '+880 17XX-XXXXXX',
      realPhone: phone || '+880 1700-000000',
      status: 'Pending', // Mandatory Admin Approval
      createdAt: 'এখনই',
      likes: 0,
      commentsCount: 0,
      isVerifiedUser: authorRole === 'Provider',
    };

    onAddPost(newPost);
    setShowCreateModal(false);
    // Reset
    setTitle('');
    setContent('');
    alert(lang === 'bn' 
      ? 'আপনার পোস্টটি সফলভাবে জমা হয়েছে। অ্যাডমিন প্যানেল অ্যাপ্রুভ করলে ফিডে রিলিজ হবে।' 
      : 'Post submitted successfully! Pending admin approval.'
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Admin Moderation Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-slate-800 text-xs">
                {lang === 'bn' ? 'অ্যাডমিন মডারেশন প্যানেল' : 'Admin Moderation'}
              </h4>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-extrabold text-[9px]">
                  {pendingCount} {lang === 'bn' ? 'পেন্ডিং' : 'Pending'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              {lang === 'bn' 
                ? 'সকল পোস্ট অ্যাডমিন যাচাইয়ের পর অ্যাপের ফিডে প্রকাশিত হয়।' 
                : 'All posts undergo admin verification.'}
            </p>
          </div>
        </div>

        {isActualAdmin && (
          <button
            onClick={handleToggleAdminMode}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              isAdminMode 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {isAdminMode 
              ? (lang === 'bn' ? 'অ্যাডমিন মোড অন' : 'Admin Mode ON') 
              : (lang === 'bn' ? 'অ্যাডমিন মোড টগল' : 'Toggle Admin')}
          </button>
        )}
      </div>

      {/* Post Filter & Action Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
          {[
            { id: 'All', labelBn: 'সব পোস্ট', labelEn: 'All Posts' },
            { id: 'NeedWork', labelBn: '🛠️ কাজ', labelEn: 'Work' },
            { id: 'Service', labelBn: '👨‍🔧 সেবা', labelEn: 'Services' },
            { id: 'Property', labelBn: '🏠 সম্পত্তি', labelEn: 'Property' },
            { id: 'ECommerce', labelBn: '🛍️ কেনাবেচা', labelEn: 'Buy/Sell' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategoryFilter === cat.id
                  ? 'bg-[#00A86B] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lang === 'bn' ? cat.labelBn : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Create Post Trigger */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-2.5 py-1.5 rounded-lg bg-[#FF6B35] hover:bg-[#e05a2b] text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'পোস্ট করুন' : 'Post'}</span>
        </button>
      </div>

      {/* Feed Stream - 2-Column Compact Grid */}
      <div>
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-slate-700 font-bold text-xs mb-1">
              {lang === 'bn' ? 'কোনো পোস্ট পাওয়া যায়নি' : 'No posts found'}
            </h4>
            <p className="text-slate-500 text-[10px] max-w-sm mx-auto">
              {lang === 'bn' ? 'আপনার নির্বাচিত ক্যাটাগরি বা এলাকায় এখনও কোনো পোস্ট করা হয়নি।' : 'Try changing location filter or categories.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredPosts.map(post => (
              <div 
                key={post.id}
                className={`bg-white border rounded-2xl p-2.5 space-y-1.5 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                  post.status === 'Pending' 
                    ? 'border-amber-400 bg-amber-50/50' 
                    : 'border-slate-200/90 hover:border-[#00A86B]'
                }`}
              >
                {/* Status Ribbon if pending */}
                {post.status === 'Pending' && (
                  <div className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 flex items-center justify-between -mx-2.5 -mt-2.5 mb-1">
                    <span className="flex items-center gap-0.5 truncate">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{lang === 'bn' ? 'পেন্ডিং রিভিউ' : 'Pending'}</span>
                    </span>
                    {isAdminMode && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onApprovePost(post.id)}
                          className="bg-emerald-700 text-white px-1 py-0.2 rounded text-[8px] font-bold"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => onRejectPost(post.id)}
                          className="bg-rose-800 text-white px-1 py-0.2 rounded text-[8px] font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Author Header */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={post.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} 
                        alt={post.authorName}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200" 
                      />
                      {post.isVerifiedUser && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-[#00A86B] text-white p-0.2 rounded-full" title="Verified">
                          <CheckCircle2 className="w-2.5 h-2.5 fill-[#00A86B] text-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">{post.authorName}</h4>
                      <span className="text-[9px] text-slate-400 block truncate">{post.createdAt}</span>
                    </div>
                  </div>

                  {/* Post Type Badge */}
                  <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[8px] font-bold shrink-0 border border-slate-200">
                    {post.postType === 'NeedWork' && '🛠️ কাজ'}
                    {post.postType === 'Service' && '👨‍🔧 সেবা'}
                    {post.postType === 'Property' && '🏠 বাসা'}
                    {post.postType === 'ECommerce' && '🛍️ বেচাকেনা'}
                    {post.postType === 'General' && '📢 সাধারণ'}
                  </span>
                </div>

                {/* Title & Body */}
                <div 
                  onClick={() => onSelectPost && onSelectPost(post)}
                  className="cursor-pointer group"
                >
                  <h3 className="font-black text-slate-800 text-[12px] leading-snug line-clamp-2 group-hover:text-[#00A86B] transition-colors">{post.title}</h3>
                  <p className="text-slate-500 text-[10px] leading-tight line-clamp-2 mt-0.5">{post.content}</p>
                </div>

                {/* Post Image if any - Max 80px */}
                {post.image && (
                  <div 
                    onClick={() => onSelectPost && onSelectPost(post)}
                    className="rounded-lg overflow-hidden border border-slate-200 h-[80px] bg-slate-100 shrink-0 cursor-pointer hover:opacity-95 transition-all"
                  >
                    <img src={post.image} alt="Post preview" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Location Badge */}
                <div className="text-[9px] text-[#00A86B] font-bold flex items-center gap-0.5 truncate bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  <MapPin className="w-2.5 h-2.5 text-[#00A86B] shrink-0" />
                  <span className="truncate">📍 {post.upazila}, {post.mahalla}</span>
                </div>

                {/* Contact Unlock Section */}
                <div className="pt-1">
                  {post.isContactUnlocked ? (
                    <a
                      href={`tel:${post.realPhone}`}
                      className="w-full py-1 bg-[#00A86B] hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{post.realPhone}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onUnlockContact(post.id)}
                      className="w-full py-1 bg-[#FF6B35] hover:bg-[#e05a2b] text-white font-black text-[10px] rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Lock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{lang === 'bn' ? '📞 আনলক (৳১০)' : 'Unlock (৳10)'}</span>
                    </button>
                  )}
                </div>

                {/* Footer Engagement */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                  <button className="flex items-center gap-0.5 hover:text-[#00A86B] cursor-pointer">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-0.5 hover:text-[#00A86B] cursor-pointer">
                    <MessageSquare className="w-3 h-3" />
                    <span>{post.commentsCount}</span>
                  </button>
                  <button 
                    onClick={() => alert('🚩 পোস্টটির বিরুদ্ধে রিপোর্ট করা হয়েছে। মডারেশন টিম ২৪ ঘণ্টার মধ্যে ব্যবস্থা নেবে।')} 
                    className="text-rose-500 hover:text-rose-700 font-bold flex items-center gap-0.5 cursor-pointer"
                    title="রিপোর্ট করুন"
                  >
                    <span>🚩 রিপোর্ট</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create Post */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-white">
            
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Plus className="w-5 h-5" />
                <h3>{lang === 'bn' ? 'নতুন পোস্ট তৈরি করুন (অ্যাডমিন অ্যাপ্রুভাল বাধ্যতামূলক)' : 'Create New Post'}</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Post Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {lang === 'bn' ? 'পোস্টের ধরন' : 'Post Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'NeedWork', label: '🛠️ কাজ প্রয়োজন (User)' },
                    { id: 'Service', label: '👨‍🔧 সার্ভিস অফার (Provider)' },
                    { id: 'Property', label: '🏠 বাসা/জমি বিজ্ঞাপন' },
                    { id: 'ECommerce', label: '🛍️ কেনাবেচা পোস্ট' },
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setPostType(t.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-all ${
                        postType === t.id
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {lang === 'bn' ? 'পোস্টের শিরোনাম (Title)' : 'Post Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: উত্তরা সেক্টর ৩ এ ২ জন রঙ মিস্ত্রি দরকার' : 'e.g. Need Electrician in Uttara'}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Content Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {lang === 'bn' ? 'বিস্তারিত বিবরণ' : 'Detailed Description'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={lang === 'bn' ? 'কাজের বিস্তারিত, কাজের স্থান, সময়সূচি ইত্যাদি...' : 'Detailed descriptions...'}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Price / Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {lang === 'bn' ? 'বাজেট / মূল্য (টাকা)' : 'Price / Rate (BDT)'}
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    value={price}
                    onChange={e => setPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {lang === 'bn' ? 'আপনার মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Hyperlocal Location Preview */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedDistrict} ➔ {selectedUpazila} ➔ {selectedMahalla}
                </span>
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                </button>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  {lang === 'bn' 
                    ? 'পোস্ট সাবমিট করার পর আমাদের সিস্টেম অ্যাডমিন রিভিউ করবে। ভেরিফিকেশন সম্পন্ন হলে অ্যাপের ফিডে প্রকাশিত হবে।' 
                    : 'Your post will be reviewed by Jhadimadi admins before going live.'}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-950"
                >
                  {lang === 'bn' ? 'পোস্ট জমা দিন' : 'Submit Post'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
