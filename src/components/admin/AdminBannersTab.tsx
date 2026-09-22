import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  MoveUp, 
  MoveDown,
  Layout,
  Tag,
  Link2,
  X,
  UploadCloud,
  Check,
  FolderOpen
} from 'lucide-react';
import { useData, AdminBanner } from '../../context/DataContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { ImageUploadField } from './ImageUploadField';
import { AdminUploadForm } from './AdminUploadForm';
import { resilientSupabaseUpsert, resilientSupabaseDelete, saveBannerToPlatformBanners } from '../../services/supabaseDbHelper';
import { SupabaseMediaPickerModal } from './SupabaseMediaPickerModal';

interface AdminBannersTabProps {
  initialImageUrl?: string;
  onClearInitialImage?: () => void;
}

export const AdminBannersTab: React.FC<AdminBannersTabProps> = ({
  initialImageUrl,
  onClearInitialImage
}) => {
  const { banners, setBanners, addBanner, updateBanner, deleteBanner, toggleBannerStatus } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDirectBannerModal, setShowDirectBannerModal] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminBanner | null>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [placementFilter, setPlacementFilter] = useState<string>('all');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    tag: 'স্পেশাল অফার',
    imageUrl: '',
    targetLink: 'auto_directory',
    placement: 'homepage_hero' as AdminBanner['placement'],
    order: 1,
    isActive: true
  });

  // Handle incoming image from Media Gallery
  React.useEffect(() => {
    if (initialImageUrl && initialImageUrl.trim()) {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        tag: 'স্পেশাল অফার',
        imageUrl: initialImageUrl.trim(),
        targetLink: 'auto_directory',
        placement: 'homepage_hero',
        order: (banners || []).length + 1,
        isActive: true
      });
      setIsModalOpen(true);
      if (onClearInitialImage) {
        onClearInitialImage();
      }
    }
  }, [initialImageUrl]);

  const presetImages = [
    { label: 'অর্গানিক ফ্রুটস', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80' },
    { label: 'মার্কেটপ্লেস সমাহার', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' },
    { label: 'তাঁত ও হস্তশিল্প', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80' },
    { label: 'রক্তদান ও জরুরি', url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80' },
    { label: 'পাহাড়ি মধু ও মশলা', url: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=1200&q=80' },
    { label: 'চান্দের গাড়ি সাজেক', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80' }
  ];

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      tag: 'স্পেশাল অফার',
      imageUrl: '',
      targetLink: 'auto_directory',
      placement: 'homepage_hero',
      order: (banners || []).length + 1,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: AdminBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      tag: banner.tag || 'স্পেশাল অফার',
      imageUrl: banner.imageUrl || '',
      targetLink: banner.targetLink || 'auto_directory',
      placement: banner.placement || 'homepage_hero',
      order: Number(banner.order) || 1,
      isActive: banner.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      alert('অনুগ্রহ করে ব্যানারের শিরোনাম ও ছবির লিঙ্ক প্রদান করুন');
      return;
    }

    const generateUniqueId = (): string => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const bannerId = editingBanner ? editingBanner.id : generateUniqueId();

    const imgUrl = (formData.imageUrl || (formData as any).image_url || (formData as any).image || '').trim();
    const linkUrl = (formData.targetLink || (formData as any).linkUrl || (formData as any).link_url || '/').trim();

    // 1. Persistent Banner Save to platform_banners with exact column names:
    // {
    //   title: formData.title || '',
    //   subtitle: formData.subtitle || '',
    //   image_url: formData.image_url || formData.image || '',
    //   link_url: formData.link_url || ''
    // }
    const platformBannerPayload = {
      title: formData.title || '',
      subtitle: formData.subtitle || '',
      image_url: (formData as any).image_url || (formData as any).image || formData.imageUrl || '',
      link_url: (formData as any).link_url || formData.targetLink || (formData as any).linkUrl || ''
    };

    const bannerData: AdminBanner = {
      ...formData,
      id: bannerId,
      title: formData.title?.trim() || '',
      subtitle: formData.subtitle?.trim() || '',
      imageUrl: imgUrl,
      image_url: imgUrl,
      image: imgUrl,
      link_url: linkUrl,
      linkUrl: linkUrl,
      targetLink: linkUrl,
      actionUrl: linkUrl,
      tag: formData.tag || 'স্পেশাল অফার',
      placement: formData.placement || 'homepage_hero',
      isActive: formData.isActive ?? true,
      order: Number(formData.order) || 1,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Save directly to platform_banners with exact requested columns
    let newId = bannerId;
    try {
      const { data: pbData, error: pbErr } = await supabase
        .from('platform_banners')
        .insert([platformBannerPayload])
        .select();
      if (!pbErr && pbData && pbData[0]?.id) {
        newId = String(pbData[0].id);
      } else {
        const pResult = await saveBannerToPlatformBanners(platformBannerPayload);
        if (pResult.data?.[0]?.id) {
          newId = String(pResult.data[0].id);
        }
      }
    } catch (pbErr) {
      console.warn('[AdminBannersTab] Direct platform_banners insert note:', pbErr);
      const pResult = await saveBannerToPlatformBanners(platformBannerPayload);
      if (pResult.data?.[0]?.id) {
        newId = String(pResult.data[0].id);
      }
    }

    const finalBanner: AdminBanner = { ...bannerData, id: newId };

    // Also mirror to banners table with strictly compliant columns:
    const cleanBannerPayload: Record<string, any> = {
      title: finalBanner.title,
      subtitle: finalBanner.subtitle,
      image_url: finalBanner.imageUrl,
      badge: finalBanner.tag,
      placement: finalBanner.placement,
      target_link: finalBanner.targetLink,
      display_order: finalBanner.order,
      is_active: finalBanner.isActive
    };

    if (editingBanner) {
      resilientSupabaseUpsert('banners', cleanBannerPayload, {
        id: editingBanner.id,
        isUpdate: true
      }).catch(() => {});

      // Update state directly without wipeout
      setBanners(prev => prev.map(b => b.id === editingBanner.id ? finalBanner : b));
      await updateBanner(editingBanner.id, finalBanner);
      setBrokenImages(prev => {
        const next = { ...prev };
        delete next[editingBanner.id];
        return next;
      });
    } else {
      resilientSupabaseUpsert('banners', cleanBannerPayload, {
        isUpdate: false
      }).catch(() => {});

      // 3. PREVENT IMMEDIATE STATE WIPEOUT:
      // Append the newly created banner directly to the local React state immediately after successful insertion
      setBanners(prev => [finalBanner, ...prev.filter(b => b.id !== newId)]);
      addBanner(finalBanner);
      databaseService.notifyEntityChange('banners');
    }

    setIsModalOpen(false);
  };

  // Dedicated Delete Banner Handler targeting Supabase 'banners' and 'platform_banners' table resiliently
  const handleDeleteBanner = async (idToDelete: string, title?: string) => {
    if (!idToDelete) {
      console.warn("Delete aborted: missing banner ID");
      return;
    }

    if (!window.confirm(`আপনি কি '${title || 'এই'}' ব্যানারটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      return;
    }

    const targetBanner = (banners || []).find(b => b.id === idToDelete);

    // 1. Delete from Supabase 'banners' and 'platform_banners' table with resilient schema & UUID safety
    await resilientSupabaseDelete('banners', {
      id: idToDelete,
      title: targetBanner?.title || title,
      image_url: targetBanner?.imageUrl || targetBanner?.image_url || (targetBanner as any)?.image
    });

    // 2. Remove matching item from local React state
    setBanners((prevBanners) => prevBanners.filter((banner) => banner.id && banner.id !== idToDelete));

    // 3. Complete backend service sync
    try {
      await deleteBanner(idToDelete);
    } catch (err) {
      console.warn("Failed to delete banner from local service:", err);
    }
  };

  // Filter out corrupted rows and empty dummy entries, mapping both image_url and image
  const filteredBanners = (banners || [])
    .filter(b => {
      if (!b || !b.id) return false;
      const hasTitle = Boolean(b.title && b.title.trim());
      const img = b.imageUrl || b.image_url || (b as any).image || '';
      const hasImage = Boolean(img && img.trim());
      // Corrupt row if both title and image are missing
      if (!hasTitle && !hasImage) return false;
      if (placementFilter === 'all') return true;
      return b.placement === placementFilter;
    })
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const activeHeroBanners = (banners || []).filter(b => {
    if (!b || !b.id || b.isActive === false) return false;
    const img = b.imageUrl || b.image_url || (b as any).image || '';
    if (!img || !img.trim() || brokenImages[b.id]) return false;
    return !b.placement || b.placement === 'homepage_hero';
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="admin-banners-tab">
      
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                ব্যানার ও বিজ্ঞাপন স্লাইডার কন্ট্রোল
              </h1>
              <p className="text-xs text-slate-500">
                হোমপেজ প্রোমোশনাল ব্যানার, স্পেশাল ক্যাম্পেইন ও বিজ্ঞাপন স্লাইডার ম্যানেজ করুন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDirectBannerModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            title="কম্পিউটার থেকে সরাসরি Supabase Storage-এ ব্যানার আপলোড করুন"
          >
            <UploadCloud className="w-4 h-4" />
            <span>সরাসরি ব্যানার আপলোড</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ব্যানার যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* DIRECT SUPABASE STORAGE BANNER UPLOAD MODAL */}
      {showDirectBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                সরাসরি Supabase Storage ব্যানার আপলোডার
              </h2>
              <button
                type="button"
                onClick={() => setShowDirectBannerModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminUploadForm
              mode="banner"
              onUploadSuccess={(url) => {
                setShowDirectBannerModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Live Interactive Hero Slider Preview on Top */}
      {activeHeroBanners.length > 0 && (
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> হোমপেজ লাইভ স্লাইডার প্রিভিউ (Live Mobile/Web Preview)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              সক্রিয় ব্যানার: {activeHeroBanners.length}টি
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[24/8] max-h-56 bg-slate-900 border border-slate-700">
            {activeHeroBanners[activePreviewIndex] && (
              <div className="relative w-full h-full bg-slate-900">
                <img 
                  src={activeHeroBanners[activePreviewIndex].imageUrl} 
                  alt={activeHeroBanners[activePreviewIndex].title}
                  className="w-full h-full object-cover brightness-75 bg-slate-900"
                  style={{ objectFit: 'cover' }}
                  data-banner-image="true"
                  onError={() => {
                    setBrokenImages(prev => ({ ...prev, [activeHeroBanners[activePreviewIndex].id]: true }));
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6">
                  <span className="inline-block self-start bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1.5">
                    {activeHeroBanners[activePreviewIndex].tag}
                  </span>
                  <h2 className="text-base sm:text-xl font-black text-white drop-shadow">
                    {activeHeroBanners[activePreviewIndex].title}
                  </h2>
                  <p className="text-xs text-slate-200 line-clamp-1 max-w-xl">
                    {activeHeroBanners[activePreviewIndex].subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Slider Dots */}
            <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-10">
              {activeHeroBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePreviewIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activePreviewIndex === idx ? 'w-6 bg-emerald-400' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'all', label: 'সব ব্যানার' },
          { id: 'homepage_hero', label: 'হোমপেজ হিরো স্লাইডার' },
          { id: 'directory_top', label: 'ডিরেক্টরি হেডার' },
          { id: 'vendor_spotlight', label: 'উদ্যোক্তা স্পটলাইট' },
          { id: 'popup_ad', label: 'পপ-আপ বিজ্ঞাপন' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setPlacementFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              placementFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banners Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBanners.map(banner => (
          <div 
            key={banner.id} 
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail with overlay tags or Re-upload image option */}
              <div className="relative aspect-[16/7] w-full bg-slate-900 overflow-hidden">
                {(() => {
                  const bannerImg = (banner.imageUrl || banner.image_url || (banner as any).image || '').trim();
                  if (!bannerImg || brokenImages[banner.id]) {
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900 border-b border-slate-800">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1.5 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/60">
                            <ImageIcon className="w-3.5 h-3.5" />
                            ছবি পাওয়া যায়নি বা নষ্ট (Missing Image)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(banner)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>ছবি পুনরায় আপলোড / পরিবর্তন</span>
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <>
                      <img 
                        src={bannerImg} 
                        alt={banner.title}
                        className={`w-full h-full object-cover bg-slate-900 ${!banner.isActive ? 'grayscale opacity-60' : ''}`}
                        style={{ objectFit: 'cover' }}
                        data-banner-image="true"
                        onError={() => {
                          setBrokenImages(prev => ({ ...prev, [banner.id]: true }));
                        }}
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-700">
                          অর্ডার: #{banner.order}
                        </span>
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                          {banner.tag}
                        </span>
                      </div>
                    </>
                  );
                })()}

                <div className="absolute top-2.5 right-2.5">
                  <button
                    onClick={() => toggleBannerStatus(banner.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                      banner.isActive 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {banner.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{banner.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Layout className="w-3.5 h-3.5" />
                    {banner.placement === 'homepage_hero' ? 'হোমপেজ হিরো স্লাইডার' :
                     banner.placement === 'directory_top' ? 'ডিরেক্টরি হেডার' :
                     banner.placement === 'vendor_spotlight' ? 'উদ্যোক্তা স্পটলাইট' : 'পপ-আপ বিজ্ঞাপন'}
                  </span>
                  <span className="font-mono text-[10px]">{banner.createdAt}</span>
                </div>

                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  {banner.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {banner.subtitle}
                </p>

                <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>লিঙ্ক ডেস্টিনেশন: {banner.targetLink}</span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateBanner(banner.id, { order: Math.max(1, banner.order - 1) })}
                  className="p-1.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer transition"
                  title="উপরে নিন"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateBanner(banner.id, { order: banner.order + 1 })}
                  className="p-1.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer transition"
                  title="নিচে নিন"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(banner)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>এডিট</span>
                </button>
                <button
                  onClick={() => handleDeleteBanner(banner.id, banner.title)}
                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl cursor-pointer transition"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add / Edit Banner Enlarged Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {editingBanner ? 'ব্যানার সম্পাদনা ও লাইভ প্রিভিউ' : 'নতুন ব্যানার তৈরি করুন'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    পিসি থেকে ছবি আপলোড করুন এবং হোমপেজ বা অ্যাপ স্লাইডারের জন্য ব্যানার কনফিগার করুন
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs font-bold">
              
              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Form Controls (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="text-slate-700 block mb-1.5 font-bold">ব্যানার শিরোনাম (Title): *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="যেমন: পাহাড়ি অর্গানিক ফ্রুটস ও জুম ফসল"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1.5 font-bold">সাবটাইটেল / বিবরণ:</label>
                    <textarea 
                      rows={2}
                      placeholder="যেমন: রাসায়নিক ও কীটনাশক মুক্ত ১০০% সতেজ পাহাড়ি ফলমূল সরাসরি বাগান থেকে"
                      value={formData.subtitle}
                      onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 block mb-1.5 font-bold">ট্যাগ / ব্যাজ:</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: স্পেশাল অফার, AI Powered"
                        value={formData.tag}
                        onChange={e => setFormData({ ...formData, tag: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1.5 font-bold">ডিসপ্লে পজিশন (Placement):</label>
                      <select
                        value={formData.placement}
                        onChange={e => setFormData({ ...formData, placement: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold bg-white cursor-pointer"
                      >
                        <option value="homepage_hero">হোমপেজ হিরো স্লাইডার</option>
                        <option value="directory_top">ডিরেক্টরি হেডার</option>
                        <option value="vendor_spotlight">উদ্যোক্তা স্পটলাইট</option>
                        <option value="popup_ad">পপ-আপ বিজ্ঞাপন</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 block mb-1.5 font-bold">ক্লিক টার্গেট লিংক:</label>
                      <select
                        value={formData.targetLink}
                        onChange={e => setFormData({ ...formData, targetLink: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold bg-white cursor-pointer"
                      >
                        <option value="home">হোমপেজ (Home)</option>
                        <option value="services">সেবাসমূহ (Services)</option>
                        <option value="auto_directory">অটো-ক্যাটাগরি মার্কেটপ্লেস</option>
                        <option value="track_a_vendor">উদ্যোক্তা ক্যাটালগ</option>
                        <option value="track_b_freelancer">পেশাজীবী ডিরেক্টরি</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1.5 font-bold">ক্রম নম্বর (Order):</label>
                      <input 
                        type="number" 
                        min={1}
                        value={formData.order}
                        onChange={e => setFormData({ ...formData, order: Number(e.target.value) || 1 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2.5 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      id="banner-is-active"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                    />
                    <label htmlFor="banner-is-active" className="text-slate-700 cursor-pointer font-bold text-xs select-none">
                      তাত্ক্ষণিকভাবে হোমপেজ ও অ্যাপে প্রদর্শন (Active) চালু রাখুন
                    </label>
                  </div>
                </div>

                {/* Right Column: Direct PC Image Upload & Live Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-slate-700 font-bold text-xs">ব্যানার ইমেজ ফাইল:</span>
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                      title="স্টোরেজ বাকেট গ্যালারি থেকে সরাসরি ছবি বাছুন"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>গ্যালারি / বাকেট থেকে নিন</span>
                    </button>
                  </div>

                  <ImageUploadField
                    label="ব্যানার ছবি (PC / Folder থেকে)"
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    recommendedSize="১২০০×৫০০ px, Max 5MB"
                    aspectRatioLabel="16:9 / 3:1 Banner"
                    maxWidth={1200}
                    maxHeight={600}
                    bucket="banners"
                    presets={presetImages}
                    required={true}
                  />

                  {/* Live Mini Preview Box */}
                  {formData.imageUrl && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 block">লাইভ স্লাইডার লুক:</span>
                      <div className="relative h-28 sm:h-32 rounded-2xl overflow-hidden shadow-md border border-slate-200 group">
                        <img 
                          src={formData.imageUrl} 
                          alt="Banner Preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-3 flex flex-col justify-end text-white text-left">
                          <span className="inline-block self-start text-[9px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-md mb-1 shadow-xs">
                            {formData.tag || 'অফার'}
                          </span>
                          <h4 className="text-xs font-black line-clamp-1 text-white">
                            {formData.title || 'ব্যানার শিরোনাম'}
                          </h4>
                          {formData.subtitle && (
                            <p className="text-[10px] text-slate-200 line-clamp-1 opacity-90 font-normal">
                              {formData.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-md transition cursor-pointer font-black text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingBanner ? 'ব্যানার আপডেট করুন' : 'নতুন ব্যানার পাবলিশ করুন'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Supabase Media Picker Modal for Banners */}
      <SupabaseMediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(urls) => {
          if (urls && urls[0]) {
            setFormData(prev => ({ ...prev, imageUrl: urls[0] }));
          }
          setIsMediaPickerOpen(false);
        }}
        allowMultiple={false}
        title="ব্যানারের ছবি নির্বাচন করুন (Supabase Storage বাকেট)"
      />

    </div>
  );
};
