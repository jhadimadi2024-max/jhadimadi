import React, { useState, useMemo } from 'react';
import { useData, AdminUserRecord, AdminOrder } from '../context/DataContext';
import { StoreProduct } from '../data/productsData';
import { 
  Package, 
  Users, 
  Truck, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Filter, 
  Eye, 
  Sparkles, 
  TrendingUp, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  ExternalLink,
  RefreshCw,
  ChevronRight,
  BadgeCheck,
  Building,
  Briefcase,
  X,
  Plus,
  Minus,
  BarChart3,
  Image as ImageIcon,
  Droplet,
  MessageSquare,
  Compass,
  ArrowLeft,
  KeyRound,
  CreditCard,
  Bot,
  Activity
} from 'lucide-react';
import { AdminAnalyticsTab } from './admin/AdminAnalyticsTab';
import { AdminTransactionsTab } from './admin/AdminTransactionsTab';
import { AdminAiAutomationTab } from './admin/AdminAiAutomationTab';
import { AdminBannersTab } from './admin/AdminBannersTab';
import { AdminBloodDonorsTab } from './admin/AdminBloodDonorsTab';
import { AdminComplaintsTab } from './admin/AdminComplaintsTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminAccountSecurityTab } from './admin/AdminAccountSecurityTab';
import { AdminConfirmDialog } from './admin/AdminConfirmDialog';
import { ImageUploadField } from './admin/ImageUploadField';
import { PRODUCT_CATEGORIES, getCategoryLabel } from './admin/AdminProductsTab';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

const productPresetImages = [
  { label: 'পাহাড়ি চাল/শস্য', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80' },
  { label: 'পাহাড়ি হলুদ ও মসলা', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80' },
  { label: 'খাঁটি বনজ মধু', url: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=800&q=80' },
  { label: 'পাহাড়ি আনারস ও ফল', url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=800&q=80' },
  { label: 'তাঁত ও হস্তশিল্প', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' },
  { label: 'বাঁশ-বেত কুটিরশিল্প', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80' }
];

export type AdminActiveTab = 
  | 'analytics' 
  | 'transactions'
  | 'ai_automation'
  | 'banners' 
  | 'cms' 
  | 'moderation' 
  | 'blood_donors' 
  | 'complaints' 
  | 'settings' 
  | 'security'
  | 'account_security'
  | 'orders' 
  | 'add';

interface AdminScreenProps {
  onBack?: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    professionals,
    approveProfessional,
    rejectProfessional,
    deleteProfessional,
    users,
    approveUser,
    rejectUser,
    deleteUser,
    orders,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    banners,
    bloodDonors,
    complaints,
    resetToDefaults
  } = useData();

  const [activeTab, setActiveTab] = useState<AdminActiveTab>('analytics');
  const [toastMessage, setToastMessage] = useState<string>('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // CMS Search and Filter States
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // Moderation Search and Filter States
  const [moderationSearch, setModerationSearch] = useState('');
  const [moderationFilter, setModerationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'sellers'>('all');
  const [selectedProForModal, setSelectedProForModal] = useState<any | null>(null);
  const [rejectReasonModal, setRejectReasonModal] = useState<{ id: string | number; name: string } | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Orders Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'Pending' | 'Processing' | 'Delivered' | 'Cancelled'>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<AdminOrder | null>(null);

  // Add/Edit Product Form State
  const [formData, setFormData] = useState({
    id: '',
    nameBn: '',
    nameEn: '',
    price: '',
    originalPrice: '',
    category: 'Food',
    categoryLabelBn: 'ফুড / ভোজ্য পণ্য',
    stock: '50',
    unit: '১ কেজি',
    origin: 'খাগড়াছড়ি',
    badge: 'সেরা পাহাড়ি পণ্য',
    image: '',
    descriptionBn: '',
    featuresText: '১০০% খাঁটি ও নির্ভেজাল, পাহাড়ি জুমের সতেজ কাঁচামাল, কোনো কেমিক্যাল মুক্ত'
  });

  // Extract unique categories from products
  const productCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categoryLabelBn) cats.add(p.categoryLabelBn);
      else if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Filtered Products for CMS
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !productSearch || 
        p.nameBn.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(productSearch.toLowerCase())) ||
        p.id.toLowerCase().includes(productSearch.toLowerCase());
      
      const matchesCategory = productCategoryFilter === 'all' || 
        p.categoryLabelBn === productCategoryFilter || 
        p.category === productCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  // Filtered Professionals & Users for Moderation
  const filteredModerationList = useMemo(() => {
    return professionals.filter(pro => {
      const matchesSearch = !moderationSearch ||
        pro.name.toLowerCase().includes(moderationSearch.toLowerCase()) ||
        pro.job.toLowerCase().includes(moderationSearch.toLowerCase()) ||
        (pro.phone && pro.phone.includes(moderationSearch)) ||
        (pro.district && pro.district.toLowerCase().includes(moderationSearch.toLowerCase())) ||
        (pro.uniqueId && pro.uniqueId.toLowerCase().includes(moderationSearch.toLowerCase()));

      let matchesStatus = true;
      if (moderationFilter === 'pending') matchesStatus = !pro.verified;
      else if (moderationFilter === 'approved') matchesStatus = !!pro.verified;
      else if (moderationFilter === 'rejected') matchesStatus = pro.verified === false;
      else if (moderationFilter === 'sellers') matchesStatus = pro.job.includes('সেলার') || pro.job.includes('মার্চেন্ট');

      return matchesSearch && matchesStatus;
    });
  }, [professionals, moderationSearch, moderationFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = !orderSearch ||
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerPhone.includes(orderSearch);

      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Form Reset
  const resetForm = () => {
    setFormData({
      id: '',
      nameBn: '',
      nameEn: '',
      price: '',
      originalPrice: '',
      category: 'Food',
      categoryLabelBn: 'ফুড / ভোজ্য পণ্য',
      stock: '50',
      unit: '১ কেজি',
      origin: 'খাগড়াছড়ি',
      badge: 'সেরা পাহাড়ি পণ্য',
      image: '',
      descriptionBn: '',
      featuresText: '১০০% খাঁটি ও নির্ভেজাল, পাহাড়ি জুমের সতেজ কাঁচামাল, কোনো কেমিক্যাল মুক্ত'
    });
    setEditingProduct(null);
  };

  // Populate Form for Editing
  const startEditProduct = (prod: StoreProduct) => {
    setEditingProduct(prod);
    setFormData({
      id: prod.id,
      nameBn: prod.nameBn,
      nameEn: prod.nameEn || '',
      price: String(prod.price),
      originalPrice: String(prod.originalPrice || Math.round(prod.price * 1.2)),
      category: prod.category || 'পাহাড়ি চাল ও শস্য',
      categoryLabelBn: prod.categoryLabelBn || prod.category || 'পাহাড়ি চাল ও শস্য',
      stock: String(prod.stock ?? 50),
      unit: prod.unit || '১ কেজি',
      origin: prod.origin || 'খাগড়াছড়ি',
      badge: prod.badge || 'সেরা পাহাড়ি পণ্য',
      image: prod.image || '',
      descriptionBn: prod.descriptionBn || '',
      featuresText: (prod.features || []).join(', ')
    });
    setActiveTab('add');
  };

  // Save or Update Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameBn || !formData.price) {
      showToast('অনুগ্রহ করে পণ্যের নাম ও মূল্য প্রদান করুন');
      return;
    }

    const featuresList = formData.featuresText
      ? formData.featuresText.split(',').map(s => s.trim()).filter(Boolean)
      : ['১০০% পাহাড়ি অর্গানিক পণ্য'];

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        nameBn: formData.nameBn,
        nameEn: formData.nameEn,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Math.round(Number(formData.price) * 1.2),
        category: formData.category,
        categoryLabelBn: formData.categoryLabelBn,
        stock: Number(formData.stock) || 0,
        unit: formData.unit,
        origin: formData.origin,
        badge: formData.badge,
        image: getProductPublicUrl(formData.image || editingProduct.image),
        descriptionBn: formData.descriptionBn,
        features: featuresList
      });
      showToast(`'${formData.nameBn}' পণ্যের তথ্য সফলভাবে আপডেট হয়েছে!`);
    } else {
      addProduct({
        nameBn: formData.nameBn,
        nameEn: formData.nameEn || formData.nameBn,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Math.round(Number(formData.price) * 1.2),
        category: formData.category,
        categoryLabelBn: formData.categoryLabelBn,
        stock: Number(formData.stock) || 50,
        unit: formData.unit,
        origin: formData.origin,
        badge: formData.badge,
        image: getProductPublicUrl(formData.image || NO_IMAGE_AVAILABLE_ICON),
        descriptionBn: formData.descriptionBn,
        features: featuresList
      });
      showToast(`'${formData.nameBn}' নতুন পণ্য হিসেবে সরাসরি হোমপেজে পাবলিশ করা হয়েছে!`);
    }

    resetForm();
    setActiveTab('cms');
  };

  // Quick Stock Adjustment
  const handleQuickStockChange = (prodId: string, delta: number) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const currentStock = prod.stock ?? 50;
    const newStock = Math.max(0, currentStock + delta);
    updateProduct(prodId, { stock: newStock });
    showToast(`স্টক আপডেট: ${newStock} প্যাক`);
  };

  // Delete Product Handler
  const handleDeleteProduct = (prod: StoreProduct) => {
    setConfirmModal({
      isOpen: true,
      title: 'পণ্য মুছে ফেলা নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত '${prod.nameBn}' পণ্যটি ডিলিট করতে চান? এটি হোমপেজ ও স্টোর থেকেও মুছে যাবে।`,
      confirmText: 'পণ্য মুছুন',
      isDanger: true,
      onConfirm: () => {
        deleteProduct(prod.id);
        showToast(`'${prod.nameBn}' পণ্যটি মুছে ফেলা হয়েছে।`);
      }
    });
  };

  // Moderation Approve Handler
  const handleApprovePro = (proId: string | number, name: string) => {
    approveProfessional(proId);
    showToast(`✓ '${name}'-এর প্রোফাইল অনুমোদিত ও ব্লু-টিক প্রদান করা হয়েছে!`);
  };

  // Moderation Reject Handler
  const handleRejectSubmit = () => {
    if (!rejectReasonModal) return;
    rejectProfessional(rejectReasonModal.id, rejectionReasonText);
    showToast(`✕ '${rejectReasonModal.name}'-এর প্রোফাইল স্থগিত/বাতিল করা হয়েছে।`);
    setRejectReasonModal(null);
    setRejectionReasonText('');
  };

  // Total metrics
  const pendingModerationCount = professionals.filter(p => !p.verified).length;
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.totalAmount : sum, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 right-6 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-slate-950 text-white p-5 shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Logo & Hub Info */}
          <div className="pb-4 mb-4 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    ঝাদিমাদি অ্যাডমিন হাব
                  </h2>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Super-Admin Control
                  </span>
                </div>
              </div>

              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                  title="অ্যাপে ফিরে যান"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              হোমপেজ প্রোডাক্টস, প্রফেশনাল মডারেশন, ব্যানার ও সেন্ট্রাল কমান্ড।
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">মোট পণ্য</span>
              <span className="text-sm font-black text-emerald-400">{products.length}টি</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">পেন্ডিং যাচাই</span>
              <span className="text-sm font-black text-amber-400">{pendingModerationCount} জন</span>
            </div>
          </div>

          {/* Navigation Items (All 5 requested modules + CMS + Orders) */}
          <nav className="space-y-1 text-xs font-bold">
            
            {/* 1. প্ল্যাটফর্ম অ্যানালিটিক্স */}
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'analytics' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>📊 প্ল্যাটফর্ম অ্যানালিটিক্স</span>
              </div>
              <span className="bg-slate-900/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-400 border border-slate-700/50">
                LIVE
              </span>
            </button>

            {/* 1.1 ফিন্যান্সিয়াল লেজার ও লেনদেন ট্র্যাকিং */}
            <button 
              id="admin-nav-transactions"
              onClick={() => setActiveTab('transactions')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'transactions' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>💳 ফিন্যান্সিয়াল লেজার (bKash/Nagad)</span>
              </div>
              <span className="bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-800/50">
                LIVE
              </span>
            </button>

            {/* 1.2 এআই অটোমেশন হাব (Gemini API) */}
            <button 
              id="admin-nav-ai-automation"
              onClick={() => setActiveTab('ai_automation')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'ai_automation' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30 font-semibold' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>🤖 এআই অটোমেশন হাব</span>
              </div>
              <span className="bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded text-[9px] font-bold border border-purple-800/50">
                Gemini
              </span>
            </button>

            {/* 2. ব্যানার ও বিজ্ঞাপন কন্ট্রোল */}
            <button 
              onClick={() => setActiveTab('banners')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'banners' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>📢 ব্যানার ও বিজ্ঞাপন কন্ট্রোল</span>
              </div>
              <span className="bg-slate-900/80 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-700/50">
                {banners.length}
              </span>
            </button>

            {/* 3. পোস্ট ও প্রোডাক্ট CMS */}
            <button 
              onClick={() => setActiveTab('cms')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'cms' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>📦 পোস্ট ও প্রোডাক্ট CMS</span>
              </div>
              <span className="bg-slate-900/80 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-700/50">
                {products.length}
              </span>
            </button>

            {/* 4. প্রোফাইল মডারেশন ও KYC */}
            <button 
              onClick={() => setActiveTab('moderation')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'moderation' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>👥 প্রোফাইল মডারেশন ও KYC</span>
              </div>
              {pendingModerationCount > 0 ? (
                <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                  {pendingModerationCount}
                </span>
              ) : (
                <span className="bg-slate-900/80 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-700/50">
                  {professionals.length}
                </span>
              )}
            </button>

            {/* 5. রক্তদাতা ডিরেক্টরি CMS */}
            <button 
              onClick={() => setActiveTab('blood_donors')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'blood_donors' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Droplet className="w-4 h-4 text-rose-400" />
                <span>🩸 রক্তদাতা ডিরেক্টরি CMS</span>
              </div>
              <span className="bg-slate-900/80 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-700/50">
                {bloodDonors.length}
              </span>
            </button>

            {/* 6. কমপ্লেন ও রিভিউ মোডারেশন */}
            <button 
              onClick={() => setActiveTab('complaints')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'complaints' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>💬 কমপ্লেন ও রিভিউ মোডারেশন</span>
              </div>
              <span className="bg-slate-900/80 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-700/50">
                {complaints.length}
              </span>
            </button>

            {/* 7. এলাকা ও ক্যাটাগরি সেটিংস */}
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-teal-400" />
                <span>📍 এলাকা ও ক্যাটাগরি সেটিংস</span>
              </div>
            </button>

            {/* 8. অর্ডার ও ট্র্যাকিং */}
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'orders' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>🚚 অর্ডার ও ট্র্যাকিং</span>
              </div>
              <span className="bg-slate-900/80 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-700/50">
                {orders.length}
              </span>
            </button>

            {/* 9. নতুন প্রোডাক্ট পোস্ট করুন */}
            <button 
              onClick={() => { resetForm(); setActiveTab('add'); }} 
              className={`w-full p-2.5 text-left rounded-xl mt-3 flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'add' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/40'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{editingProduct ? 'পোস্ট এডিট ফর্ম' : '➕ নতুন প্রোডাক্ট পোস্ট করুন'}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions / Tucked Away Footer Section */}
        <div className="pt-3 mt-4 border-t border-slate-800/80 space-y-1.5">
          {/* Security & Password - Tucked at bottom */}
          <button 
            id="admin-nav-security-password"
            onClick={() => setActiveTab('account_security')} 
            className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'account_security' 
                ? 'bg-emerald-600 text-white shadow-md font-semibold' 
                : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold">My Account & Security</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Super Admin
            </span>
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold flex items-center gap-2 transition cursor-pointer border border-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>কাস্টমার অ্যাপে ফিরে যান</span>
            </button>
          )}

          <button
            onClick={() => {
              resetToDefaults();
              showToast('লাইভ ডাটাবেস সিঙ্ক সম্পন্ন হয়েছে!');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-slate-900 flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>লাইভ ডেটা রিফ্রেশ ও সিঙ্ক করুন</span>
          </button>
          <div className="text-[10px] text-slate-500 px-3">
            v2.6 Super-Admin Active • 100% Unified Control
          </div>
        </div>
      </aside>

      {/* Main Panel Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">

        {/* TAB 0: ANALYTICS */}
        {activeTab === 'analytics' && <AdminAnalyticsTab />}

        {/* TAB: FINANCIAL TRANSACTIONS & MFS LEDGER */}
        {activeTab === 'transactions' && <AdminTransactionsTab />}

        {/* TAB: AI AUTOMATION HUB & GEMINI INTELLIGENCE */}
        {activeTab === 'ai_automation' && <AdminAiAutomationTab />}

        {/* TAB: BANNERS & ADS */}
        {activeTab === 'banners' && <AdminBannersTab />}

        {/* TAB: BLOOD DONORS CMS */}
        {activeTab === 'blood_donors' && <AdminBloodDonorsTab />}

        {/* TAB: COMPLAINTS & REVIEWS */}
        {activeTab === 'complaints' && <AdminComplaintsTab />}

        {/* TAB: SETTINGS & SECURITY */}
        {(activeTab === 'settings' || (activeTab as string) === 'security') && (
          <AdminSettingsTab initialSubTab={(activeTab as string) === 'security' ? 'security' : undefined} />
        )}

        {/* TAB: DEDICATED ACCOUNT SECURITY */}
        {activeTab === 'account_security' && (
          <AdminAccountSecurityTab onRequireRelogin={onBack} />
        )}

        {/* TAB 1: PRODUCT CMS */}
        {activeTab === 'cms' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header with Live Sync notice */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900">
                    সেন্ট্রাল প্রোডাক্ট ও পোস্ট ম্যানেজমেন্ট
                  </h1>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    লাইভ সিঙ্ক চালু
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  এখানে যেকোনো পণ্য যোগ, এডিট বা স্টক পরিবর্তন করলে তা সরাসরি কাস্টমার হোমপেজে রিয়েল-টাইমে দৃশ্যমান হবে।
                </p>
              </div>
              <button 
                onClick={() => { resetForm(); setActiveTab('add'); }} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                নতুন পোস্ট যোগ করুন
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="পণ্যের নাম বা আইডি দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
                {productSearch && (
                  <button 
                    onClick={() => setProductSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setProductCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    productCategoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  সকল পণ্য ({products.length})
                </button>
                {productCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      productCategoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-sm">কোনো পণ্য পাওয়া যায়নি</p>
                <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে সার্চ কোয়েরি বা ক্যাটাগরি ফিল্টার পরিবর্তন করুন।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Product Image & Badges */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img 
                          src={getProductPublicUrl(p.image)} 
                          alt={p.nameBn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                          }}
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="text-[10px] bg-slate-950/80 backdrop-blur-xs text-emerald-300 px-2 py-0.5 rounded-md font-black shadow-xs">
                            {p.categoryLabelBn || p.category}
                          </span>
                          {p.badge && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md font-bold shadow-xs">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <span className="absolute bottom-2 right-2 text-[10px] bg-white/95 text-slate-700 px-2 py-0.5 rounded-md font-bold shadow-xs">
                          {p.origin}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                          {p.nameBn}
                        </h3>
                        {p.nameEn && (
                          <p className="text-[11px] text-slate-400 font-medium truncate">{p.nameEn}</p>
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {p.descriptionBn || 'খাঁটি পাহাড়ি অর্গানিক পণ্য।'}
                        </p>

                        {/* Price & Stock info */}
                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-base font-extrabold text-emerald-600">৳{p.price}</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-xs text-slate-400 line-through ml-1.5">৳{p.originalPrice}</span>
                            )}
                            <span className="text-[10px] text-slate-400 block font-normal">{p.unit}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                              স্টক: {p.stock ?? 50}
                            </span>
                          </div>
                        </div>

                        {/* Quick Stock Controls */}
                        <div className="flex items-center justify-between pt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="font-bold">কুইক স্টক:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleQuickStockChange(p.id, -5)}
                              className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black hover:bg-slate-100"
                              title="-5 স্টক"
                            >
                              -5
                            </button>
                            <span className="font-mono font-bold px-1">{p.stock ?? 50}</span>
                            <button
                              onClick={() => handleQuickStockChange(p.id, 5)}
                              className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black hover:bg-slate-100"
                              title="+5 স্টক"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex gap-2">
                      <button 
                        onClick={() => startEditProduct(p)} 
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>এডিট</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p)} 
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center transition"
                        title="পণ্যটি মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE MODERATION HUB */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Moderation Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  ইউজার ও পেশাজীবী প্রোফাইল মডারেশন
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  নতুন রেজিস্ট্রিকৃত পেশাজীবী ও সেলারদের এনআইডি, পেমেন্ট ট্রানজেকশন এবং ডকুমেন্ট যাচাই করে ব্লু-টিক প্রদান করুন।
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('ai_automation')}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  এআই অটো-অ্যাপ্রুভাল
                </button>
                <span className="text-xs bg-amber-50 text-amber-800 font-bold px-3 py-1.5 rounded-xl border border-amber-200">
                  অপেক্ষমান: {pendingModerationCount} জন
                </span>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={moderationSearch}
                  onChange={(e) => setModerationSearch(e.target.value)}
                  placeholder="নাম, পেশা, ফোন নম্বর বা মেম্বার আইডি..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setModerationFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    moderationFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  সকল ({professionals.length})
                </button>
                <button
                  onClick={() => setModerationFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    moderationFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  ⏳ অপেক্ষমান যাচাই ({pendingModerationCount})
                </button>
                <button
                  onClick={() => setModerationFilter('approved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    moderationFilter === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  ✓ অনুমোদিত ({professionals.filter(p => p.verified).length})
                </button>
              </div>
            </div>

            {/* Moderation Profiles List */}
            {filteredModerationList.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-sm">কোনো প্রোফাইল মেলেনি</p>
                <p className="text-xs text-slate-400 mt-1">অন্য কোনো ফিল্টার বা সার্চ দিয়ে চেষ্টা করুন।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredModerationList.map(pro => (
                  <div 
                    key={pro.id} 
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                  >
                    {/* Left: Avatar + Info */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="relative">
                        <img 
                          src={pro.img || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150'} 
                          alt={pro.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs" 
                        />
                        {pro.verified ? (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-xs">
                            <BadgeCheck className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 border-2 border-white shadow-xs">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900">{pro.name}</h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            pro.verified 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}>
                            {pro.verified ? '✓ ভেরিফাইড ও ব্লু-টিক' : '⏳ পেন্ডিং মডারেশন'}
                          </span>
                          {pro.uniqueId && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                              {pro.uniqueId}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 font-medium flex items-center gap-2 flex-wrap">
                          <span className="text-emerald-700 font-bold">{pro.job}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {pro.district}, {pro.upazila} {pro.area ? `(${pro.area})` : ''}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {pro.phone}
                          </span>
                        </div>

                        {/* NID / Trx Status */}
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                          {pro.nid && (
                            <span>এনআইডি: <strong className="text-slate-700">{pro.nid}</strong></span>
                          )}
                          {pro.trxId && (
                            <span>TrxID: <strong className="text-emerald-700 font-mono">{pro.trxId}</strong></span>
                          )}
                          <span>অভিজ্ঞতা: <strong>{pro.experience || 'অভিজ্ঞ'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* View Details */}
                      <button
                        onClick={() => setSelectedProForModal(pro)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ডকুমেন্ট ও প্রোফাইল</span>
                      </button>

                      {!pro.verified ? (
                        <>
                          <button 
                            onClick={() => handleApprovePro(pro.id, pro.name)} 
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>অনুমোদন ও ব্লু-টিক</span>
                          </button>
                          <button 
                            onClick={() => setRejectReasonModal({ id: pro.id, name: pro.name })} 
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition"
                          >
                            বাতিল
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setRejectReasonModal({ id: pro.id, name: pro.name })} 
                          className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl transition"
                        >
                          সাসপেন্ড / রিজেক্ট
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'পেশাজীবীর প্রোফাইল মুছে ফেলা',
                            message: `আপনি কি নিশ্চিত '${pro.name}'-এর পেশাজীবী প্রোফাইল ডিলিট করতে চান?`,
                            confirmText: 'প্রোফাইল মুছুন',
                            isDanger: true,
                            onConfirm: () => {
                              deleteProfessional(pro.id);
                              showToast(`'${pro.name}'-এর প্রোফাইল মুছে ফেলা হয়েছে।`);
                            }
                          });
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 transition"
                        title="প্রোফাইল ডিলিট"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDER TRACKING */}
        {activeTab === 'orders' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Orders Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-cyan-600" />
                  অর্ডার ও পেমেন্ট ট্র্যাকিং প্যানেল
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  কাস্টমারদের প্লেস করা প্রতিটি অর্ডার পর্যবেক্ষণ ও ডেলিভারি স্ট্যাটাস আপডেট করুন।
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  ফিন্যান্সিয়াল লেজার ও TrxID
                </button>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-black px-3.5 py-1.5 rounded-xl border border-emerald-200">
                  মোট অর্ডার ভ্যালু: ৳{totalRevenue}
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="অর্ডার আইডি, গ্রাহকের নাম বা মোবাইল..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                {(['all', 'Pending', 'Processing', 'Delivered', 'Cancelled'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      orderStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? `সকল (${orders.length})` : 
                     st === 'Pending' ? `অপেক্ষমান (${orders.filter(o => o.status === 'Pending').length})` :
                     st === 'Processing' ? `প্রসেসিং (${orders.filter(o => o.status === 'Processing').length})` :
                     st === 'Delivered' ? `ডেলিভার্ড (${orders.filter(o => o.status === 'Delivered').length})` :
                     `বাতিল (${orders.filter(o => o.status === 'Cancelled').length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-sm">কোনো অর্ডার পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                      <tr>
                        <th className="p-3.5">অর্ডার ID</th>
                        <th className="p-3.5">তারিখ</th>
                        <th className="p-3.5">গ্রাহক ও যোগাযোগ</th>
                        <th className="p-3.5">আইটেম ও বিবরণ</th>
                        <th className="p-3.5">পেমেন্ট</th>
                        <th className="p-3.5">মোট মূল্য</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 font-mono font-bold text-emerald-700">{o.id}</td>
                          <td className="p-3.5 text-slate-500 whitespace-nowrap">{o.date}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{o.customerName}</span>
                            <span className="text-[11px] text-slate-500 block">{o.customerPhone}</span>
                            <span className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{o.deliveryAddress}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-slate-700 block">
                              {o.items.map(it => `${it.nameBn} (${it.quantity}x)`).join(', ')}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                              {o.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3.5 font-extrabold text-emerald-600 text-sm">
                            ৳{o.totalAmount}
                          </td>
                          <td className="p-3.5">
                            <select
                              value={o.status}
                              onChange={(e) => {
                                updateOrderStatus(o.id, e.target.value as any);
                                showToast(`অর্ডার ${o.id}-এর স্ট্যাটাস '${e.target.value}' করা হয়েছে!`);
                              }}
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none ${
                                o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                o.status === 'Processing' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                o.status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                                'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="Pending">Pending (অপেক্ষমান)</option>
                              <option value="Processing">Processing (প্রসেসিং)</option>
                              <option value="Delivered">Delivered (ডেলিভার্ড)</option>
                              <option value="Cancelled">Cancelled (বাতিল)</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'অর্ডার মুছে ফেলা নিশ্চিতকরণ',
                                  message: `আপনি কি নিশ্চিত অর্ডার #${o.id} ডিলিট করতে চান?`,
                                  confirmText: 'অর্ডার মুছুন',
                                  isDanger: true,
                                  onConfirm: () => {
                                    deleteOrder(o.id);
                                    showToast('অর্ডার ডিলিট করা হয়েছে');
                                  }
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="অর্ডার ডিলিট"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ADD/EDIT PRODUCT STUDIO (ENLARGED & SPACIOUS) */}
        {activeTab === 'add' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    {editingProduct ? 'পণ্যের তথ্য ও ছবি সম্পাদনা' : 'নতুন পণ্য ও পোস্ট তৈরি করুন'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    পিসি থেকে সরাসরি ছবি আপলোড করুন ও কাস্টমার হোমপেজে তাৎক্ষণিক পাবলিশ করুন
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    নতুন ফর্মে রূপান্তর
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { resetForm(); setActiveTab('cms'); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6 text-xs font-bold">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Form Fields (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Product Name Bn & En */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 text-slate-700 font-bold">পণ্যের নাম (বাংলা) *</label>
                      <input 
                        type="text" 
                        value={formData.nameBn} 
                        onChange={e => setFormData({...formData, nameBn: e.target.value})} 
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                        placeholder="যেমন: খাঁটি পাহাড়ি বিন্নি চাল" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-slate-700 font-bold">পণ্যের নাম (English)</label>
                      <input 
                        type="text" 
                        value={formData.nameEn} 
                        onChange={e => setFormData({...formData, nameEn: e.target.value})} 
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                        placeholder="e.g. Pure Hill Sticky Rice" 
                      />
                    </div>
                  </div>

                  {/* Price, Original Price, Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1.5 text-slate-700 font-bold">বিক্রয় মূল্য (৳) *</label>
                      <input 
                        type="number" 
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})} 
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                        placeholder="যেমন: ১২০" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-slate-700 font-bold">আগের মূল্য / MRP (৳)</label>
                      <input 
                        type="number" 
                        value={formData.originalPrice} 
                        onChange={e => setFormData({...formData, originalPrice: e.target.value})} 
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                        placeholder="যেমন: ১৫০" 
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-slate-700 font-bold">স্টক সংখ্যা (Stock)</label>
                      <input 
                        type="number" 
                        value={formData.stock} 
                        onChange={e => setFormData({...formData, stock: e.target.value})} 
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                        placeholder="৫০" 
                      />
                    </div>
                  </div>

                  {/* Category, Unit, Origin */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1.5 text-slate-700 font-bold">ক্যাটাগরি</label>
                      <select 
                        value={
                          PRODUCT_CATEGORIES.find(
                            c => c.value === formData.category || c.labelBn === formData.category || c.labelBn === formData.categoryLabelBn
                          )?.value || formData.category
                        } 
                        onChange={e => {
                          const catVal = e.target.value;
                          const label = getCategoryLabel(catVal);
                          setFormData({...formData, category: catVal, categoryLabelBn: label});
                        }} 
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none cursor-pointer"
                      >
                        {PRODUCT_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.labelBn}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1.5 text-slate-700 font-bold">একক / পরিমাপ (Unit)</label>
                      <input 
                        type="text" 
                        value={formData.unit} 
                        onChange={e => setFormData({...formData, unit: e.target.value})} 
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                        placeholder="১ কেজি / ২৫০ গ্রাম" 
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-slate-700 font-bold">উৎপত্তিস্থল (Origin)</label>
                      <input 
                        type="text" 
                        value={formData.origin} 
                        onChange={e => setFormData({...formData, origin: e.target.value})} 
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                        placeholder="খাগড়াছড়ি / বান্দরবান" 
                      />
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block mb-1.5 text-slate-700 font-bold">হাইলাইট ব্যাজ (Badge)</label>
                    <input 
                      type="text" 
                      value={formData.badge} 
                      onChange={e => setFormData({...formData, badge: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                      placeholder="যেমন: সেরা পাহাড়ি পণ্য / বেস্টসেলার / ১০০% অর্গানিক" 
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-1.5 text-slate-700 font-bold">পণ্যের বিস্তারিত বিবরণ (বাংলা)</label>
                    <textarea 
                      rows={3} 
                      value={formData.descriptionBn} 
                      onChange={e => setFormData({...formData, descriptionBn: e.target.value})} 
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl font-normal focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none leading-relaxed" 
                      placeholder="পাহাড়ি অঞ্চলের নিজস্ব জুম চাষ থেকে সংগ্রহকৃত শতভাগ খাঁটি পণ্য..." 
                    />
                  </div>

                  {/* Features (Comma separated) */}
                  <div>
                    <label className="block mb-1.5 text-slate-700 font-bold">মূল বৈশিষ্ট্যসমূহ (কমা দিয়ে আলাদা করুন)</label>
                    <input 
                      type="text" 
                      value={formData.featuresText} 
                      onChange={e => setFormData({...formData, featuresText: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-normal focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" 
                      placeholder="১০০% খাঁটি, কোনো প্রিজারভেটিভ নেই, সরাসরি জুম চাষীর থেকে" 
                    />
                  </div>
                </div>

                {/* Right Column: Direct PC Image Upload & Real-Time Card Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                  <ImageUploadField
                    label="পণ্যের ছবি (Supabase Database ও Cloud Storage থেকে)"
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    recommendedSize="৮০০×৮০০ px, Max 5MB"
                    aspectRatioLabel="1:1 বা 4:3 স্কয়ার"
                    maxWidth={800}
                    maxHeight={800}
                    presets={productPresetImages}
                    required={false}
                  />

                  {/* Real-time Product Card Preview */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 block">কাস্টমার অ্যাপে কেমন দেখাবে (লাইভ কার্ড):</span>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md max-w-xs mx-auto group">
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img 
                          src={getProductPublicUrl(formData.image || NO_IMAGE_AVAILABLE_ICON)} 
                          alt="Product Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                          }}
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="text-[10px] bg-slate-950/80 backdrop-blur-xs text-emerald-300 px-2 py-0.5 rounded-md font-black shadow-xs">
                            {formData.categoryLabelBn || 'ক্যাটাগরি'}
                          </span>
                          {formData.badge && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md font-bold shadow-xs">
                              {formData.badge}
                            </span>
                          )}
                        </div>
                        <span className="absolute bottom-2 right-2 text-[10px] bg-white/95 text-slate-700 px-2 py-0.5 rounded-md font-bold shadow-xs">
                          {formData.origin || 'খাগড়াছড়ি'}
                        </span>
                      </div>
                      
                      <div className="p-3.5 space-y-1.5">
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                          {formData.nameBn || 'পণ্যের নাম'}
                        </h4>
                        {formData.nameEn && (
                          <p className="text-[10px] text-slate-400 font-medium truncate">{formData.nameEn}</p>
                        )}
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                          {formData.descriptionBn || 'খাঁটি পাহাড়ি অর্গানিক পণ্য।'}
                        </p>
                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-sm font-extrabold text-emerald-600">৳{formData.price || '0'}</span>
                            {formData.originalPrice && Number(formData.originalPrice) > Number(formData.price) && (
                              <span className="text-[10px] text-slate-400 line-through ml-1.5">৳{formData.originalPrice}</span>
                            )}
                            <span className="text-[9px] text-slate-400 block font-normal">{formData.unit || '১ কেজি'}</span>
                          </div>
                          <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            স্টক: {formData.stock || '50'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { resetForm(); setActiveTab('cms'); }} 
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer font-bold text-xs"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-md transition font-black text-xs flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingProduct ? 'সংশোধন সেভ করুন' : 'হোমপেজে সরাসরি পাবলিশ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Professional Details Modal */}
      {selectedProForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">পেশাজীবী ও সেলার ডকুমেন্ট যাচাই</h3>
              </div>
              <button 
                onClick={() => setSelectedProForModal(null)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="flex items-center gap-4 pb-4 border-b">
                <img 
                  src={selectedProForModal.img || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150'} 
                  alt={selectedProForModal.name} 
                  className="w-16 h-16 rounded-2xl object-cover border"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedProForModal.name}</h4>
                  <p className="text-emerald-700 font-bold">{selectedProForModal.job}</p>
                  <p className="text-slate-500">{selectedProForModal.district}, {selectedProForModal.upazila}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border">
                <div>
                  <span className="text-slate-400 block text-[10px]">মোবাইল নম্বর:</span>
                  <span className="font-bold text-slate-800">{selectedProForModal.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">মেম্বার আইডি:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedProForModal.memberId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">এনআইডি নম্বর:</span>
                  <span className="font-bold text-slate-800">{selectedProForModal.nid || 'যাচাইয়ের জন্য প্রদান করা হয়েছে'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">পেমেন্ট TrxID:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedProForModal.trxId || 'BK99281XLA'}</span>
                </div>
              </div>

              {selectedProForModal.bio && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">পেশাজীবীর পরিচয় ও দক্ষতা:</span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border leading-relaxed">
                    {selectedProForModal.bio}
                  </p>
                </div>
              )}

              {/* Action in Modal */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setSelectedProForModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  বন্ধ করুন
                </button>
                {!selectedProForModal.verified && (
                  <button
                    onClick={() => {
                      handleApprovePro(selectedProForModal.id, selectedProForModal.name);
                      setSelectedProForModal(null);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow"
                  >
                    ✓ অনুমোদন ও ব্লু-টিক প্রদান
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              '{rejectReasonModal.name}'-এর প্রোফাইল বাতিল / স্থগিত করার কারণ
            </h3>
            <textarea
              rows={3}
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              placeholder="যেমন: অস্পষ্ট এনআইডি ছবি, ভুল ফোন নম্বর বা তথ্যের অমিল..."
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectReasonModal(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Sensitive Admin Actions */}
      <AdminConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};

export default AdminScreen;
