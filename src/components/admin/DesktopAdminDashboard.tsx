import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Edit3, Trash2, ArrowLeft, 
  ExternalLink, RefreshCw, Smartphone, Layers, Database, 
  ShoppingCart, Image as ImageIcon, Users, BarChart3, 
  CreditCard, Bot, Droplet, MessageSquare, Settings, 
  ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, 
  X, Check, LogOut, ChevronRight, Sparkles, Filter,
  Home, Shirt, Utensils, Zap, HardDrive, Phone, Mail,
  RotateCcw, ShieldAlert, CheckCircle, Clock, Bell, User,
  Activity, Store, Briefcase, Radio
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { isSupabaseConfigured } from '../../supabase';
import { CustomerApp, type CustomerAppTab } from '../CustomerApp';
import { AdminScreen } from '../AdminPanelModal';
import { LiveTrafficAnalyticsModal } from './LiveTrafficAnalyticsModal';
import { analyticsService } from '../../services/analyticsService';
import { INITIAL_VENDOR_STORES } from '../../data/vendorsData';

// Header Popups & Modals
import { 
  OrdersNotificationDropdown, 
  MessagesSupportDropdown, 
  AdminProfileSettingsModal, 
  AdminUniversalSearchModal 
} from './AdminHeaderModals';

// Sub-tabs
import { AdminProductsTab } from './AdminProductsTab';
import { AdminPostsTab } from './AdminPostsTab';
import { SupabaseDatabaseTab } from './SupabaseDatabaseTab';
import { CategoriesManagerTab } from './CategoriesManagerTab';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminTransactionsTab } from './AdminTransactionsTab';
import { AdminAiAutomationTab } from './AdminAiAutomationTab';
import { AdminBannersTab } from './AdminBannersTab';
import { AdminBloodDonorsTab } from './AdminBloodDonorsTab';
import { AdminComplaintsTab } from './AdminComplaintsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminAccountSecurityTab } from './AdminAccountSecurityTab';
import { AdminConfirmDialog } from './AdminConfirmDialog';
import { AdminSidebarNavigation } from './AdminSidebarNavigation';
import { useDashboardLiveStats } from '../../services/dashboardStatsService';
import { AdminAiCommandCenter } from './ai/AdminAiCommandCenter';
import { AdminMediaGalleryTab } from './AdminMediaGalleryTab';

interface DesktopAdminDashboardProps {
  onBack: () => void;
  onReturnToCustomerApp?: () => void;
}

export type AdminWorkspaceTab = 
  | 'ai_command_center'
  | 'products'
  | 'media_library'
  | 'posts'
  | 'categories'
  | 'supabase'
  | 'orders'
  | 'banners'
  | 'moderation'
  | 'analytics'
  | 'transactions'
  | 'ai_automation'
  | 'blood_donors'
  | 'complaints'
  | 'security'
  | 'settings';

export const DesktopAdminDashboard: React.FC<DesktopAdminDashboardProps> = ({ 
  onBack,
  onReturnToCustomerApp,
}) => {
  const { 
    products, 
    posts,
    orders, 
    updateOrderStatus,
    professionals, 
    users, 
    banners,
    bloodDonors,
    complaints,
    approveProfessional, 
    rejectProfessional,
    activeDraftPreview 
  } = useData();

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<AdminWorkspaceTab>('products');

  // Media Library Selection State for Products and Banners Creation
  const [gallerySelectedImageUrl, setGallerySelectedImageUrl] = useState<string | null>(null);
  const [galleryTargetAction, setGalleryTargetAction] = useState<'product' | 'banner' | null>(null);

  // Overall Dashboard Layout Mode: 'desktop' (Standalone full-screen desktop dashboard) | 'classic' (Original Extensive Admin Panel)
  const [dashboardLayout, setDashboardLayout] = useState<'desktop' | 'classic'>('desktop');

  // Optional Live Preview Drawer/Panel Toggle (Default OFF for full-screen desktop experience)
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);

  // Left Column Mobile Preview State
  const [previewKey, setPreviewKey] = useState<number>(Date.now());
  const [previewTab, setPreviewTab] = useState<CustomerAppTab>('home');
  const [isRefreshingPreview, setIsRefreshingPreview] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(1);

  // Responsive column view for mobile/tablet fallback
  const [mobileActiveColumn, setMobileActiveColumn] = useState<'menu' | 'workspace'>('workspace');

  // Dialog & Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Top Header Pop-ups & Modals State
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleReloadPreview = () => {
    setIsRefreshingPreview(true);
    setPreviewKey(Date.now());
    setTimeout(() => {
      setIsRefreshingPreview(false);
      showToast('📱 মোবাইল প্রিভিউ রিফ্রেশ সম্পন্ন!');
    }, 400);
  };

  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  const [liveTrafficStats, setLiveTrafficStats] = useState(() => analyticsService.getLiveTrafficStats());

  useEffect(() => {
    const unsub = analyticsService.subscribeLiveTraffic((stats) => {
      setLiveTrafficStats(stats);
    });
    return unsub;
  }, []);

  const registeredSellers = users.filter(u => u.role === 'seller');

  const { stats: dbStats, isLoading: isStatsLoading, refresh: refreshDbStats } = useDashboardLiveStats({
    productsCount: products.length,
    ordersCount: orders.length,
    sellersCount: registeredSellers.length,
    providersCount: professionals.length,
    donorsCount: bloodDonors.length,
    complaintsCount: complaints.length
  });

  const pendingModerationCount = professionals.filter(p => !p.verified).length;
  const totalProductsCount = dbStats.totalProducts;
  const publishedProductsCount = products.filter(p => p.isPublished !== false).length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
  const activeOrdersCount = pendingOrdersCount;

  // Registered service providers count from live DB query
  const totalServiceProvidersCount = dbStats.totalServiceProviders;
  const verifiedProsCount = professionals.filter(p => p.verified).length;

  // Registered sellers count from live DB query (zero base, no fake numbers)
  const totalSellersCount = dbStats.totalActiveSellers;
  const verifiedSellersCount = registeredSellers.filter(u => u.status === 'Approved').length;

  // Registered blood donors count from live DB query (zero base)
  const totalBloodDonorsCount = dbStats.totalRegisteredDonors;

  const pendingSupportCount = complaints.filter(c => c.status === 'Pending' || c.status === 'Under Review').length;
  const unreadSupportCount = pendingSupportCount > 0 ? pendingSupportCount : complaints.length;

  const liveVisitorCount = liveTrafficStats.activeNow;
  const todayTotalVisits = liveTrafficStats.todayTotal;

  return (
    <div className="fixed inset-0 w-screen h-screen min-h-screen overflow-hidden flex flex-col bg-slate-900 text-slate-100 font-sans select-none z-[9999]">
      
      {/* =========================================================
          TOP COMMAND BAR (Full Width Header)
         ========================================================= */}
      <header className="h-14 shrink-0 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between z-30">
        {/* Left: Brand & Admin Hub */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-900/50">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white">
                ঝাদিমাদি ডটকম
              </span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="text-xs font-bold text-emerald-400">
                ডেস্কটপ অ্যাডমিন ড্যাশবোর্ড
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>গ্লোবাল রিয়েল-টাইম সিঙ্ক সক্রিয়</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">মডেল ও প্রিভিউ কানেক্টেড</span>
            </div>
          </div>
        </div>

        {/* Center: Full-Screen Desktop Dashboard Badge & Optional Mobile Preview Toggle */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ফুলস্ক্রিন ডেস্কটপ অ্যাডমিন</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLivePreview(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                showLivePreview
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ঐচ্ছিক মোবাইল প্রিভিউ সাইড প্যানেল চালু/বন্ধ করুন"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{showLivePreview ? 'প্রিভিউ বন্ধ করুন' : '📱 মোবাইল প্রিভিউ'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDashboardLayout(prev => prev === 'classic' ? 'desktop' : 'classic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dashboardLayout === 'classic'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ক্লাসিক ফুল অ্যাডমিন ড্যাশবোর্ড ও কন্ট্রোল প্যানেল"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>ক্লাসিক প্যানেল</span>
            </button>
          </div>
        </div>

        {/* Responsive Mobile Column Switcher (for small screens < 768px) */}
        <div className="flex md:hidden items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setMobileActiveColumn('menu')}
            className={`px-2.5 py-1 rounded-lg transition ${mobileActiveColumn === 'menu' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
          >
            📋 মেনু
          </button>
          <button
            onClick={() => setMobileActiveColumn('workspace')}
            className={`px-2.5 py-1 rounded-lg transition ${mobileActiveColumn === 'workspace' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
          >
            🛠️ ওয়ার্কস্পেস
          </button>
          <button
            onClick={() => setShowLivePreview(prev => !prev)}
            className={`px-2 py-1 rounded-lg transition text-[11px] ${showLivePreview ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
          >
            📱 প্রিভিউ
          </button>
        </div>

        {/* Right: Quick Search, 3D Header Icons (Notifications, Support, Profile) & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Universal Database Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 shadow-xs transition cursor-pointer"
            title="ডাটাবেজ সার্চ (পণ্য, সেবা, রক্ত, পেশাজীবী ও এলাকা)"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>ডাটাবেজ সার্চ...</span>
            <kbd className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* 3D ICON 1: Notification (Orders Dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsOrdersOpen(prev => !prev);
                setIsMessagesOpen(false);
              }}
              className="relative p-2 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-200 border border-slate-700/90 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0.5 active:shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition cursor-pointer flex items-center justify-center"
              title="কাস্টমার অর্ডারসমূহ (Notification)"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              {orders.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[9.5px] rounded-full flex items-center justify-center shadow-md animate-pulse border border-slate-900">
                  {orders.length}
                </span>
              )}
            </button>

            {/* Notification Orders Pop-up Dropdown */}
            <OrdersNotificationDropdown 
              isOpen={isOrdersOpen}
              onClose={() => setIsOrdersOpen(false)}
              onViewAllOrders={() => {
                setActiveTab('orders');
              }}
            />
          </div>

          {/* 3D ICON 2: Messages / Support (Customer Inquiries & Direct Reply) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsMessagesOpen(prev => !prev);
                setIsOrdersOpen(false);
              }}
              className="relative p-2 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-200 border border-slate-700/90 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0.5 active:shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition cursor-pointer flex items-center justify-center"
              title="কাস্টমার মেসেজ ও সাপোর্ট (Messages / Support)"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              {unreadSupportCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-[9.5px] rounded-full flex items-center justify-center shadow-md border border-slate-900">
                  {unreadSupportCount}
                </span>
              )}
            </button>

            {/* Support Messages Pop-up Dropdown */}
            <MessagesSupportDropdown 
              isOpen={isMessagesOpen}
              onClose={() => setIsMessagesOpen(false)}
            />
          </div>

          {/* 3D ICON 3: Admin Profile / Settings (Change Username & Password) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(true);
                setIsOrdersOpen(false);
                setIsMessagesOpen(false);
              }}
              className="relative p-2 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-200 border border-slate-700/90 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0.5 active:shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition cursor-pointer flex items-center justify-center"
              title="অ্যাডমিন প্রোফাইল ও সেটিংস (Admin Profile / Settings)"
            >
              <User className="w-4 h-4 text-purple-400" />
            </button>
          </div>

          {/* 3D ICON 4: AI Smart Command Center */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ai_command_center');
                setMobileActiveColumn('workspace');
              }}
              className={`relative p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                activeTab === 'ai_command_center'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-md shadow-emerald-800/40 ring-2 ring-emerald-500/30'
                  : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-emerald-400 border-slate-700/90 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0.5'
              }`}
              title="ঝাদিমাদি AI স্মার্ট কমান্ড সেন্টার (AI Command Center)"
            >
              <Bot className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-0.5 hidden sm:block"></div>

          {onReturnToCustomerApp && (
            <button
              onClick={() => {
                if (onReturnToCustomerApp) {
                  onReturnToCustomerApp();
                } else if (window.opener && !window.opener.closed) {
                  window.close();
                } else {
                  window.location.href = '/';
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-100 border border-emerald-700/60 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              title="কাস্টমার অ্যাপে ফিরে যান"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">কাস্টমার অ্যাপে ফিরুন</span>
            </button>
          )}

          <button
            onClick={() => window.open('/', '_blank')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="নতুন উইন্ডোতে কাস্টমার অ্যাপ দেখুন"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>নতুন ট্যাবে</span>
          </button>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold transition cursor-pointer"
            title="অ্যাডমিন প্যানেল বন্ধ করুন"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </header>

      {/* Admin Profile & Security Settings Modal */}
      <AdminProfileSettingsModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSuccessToast={showToast}
      />

      {/* Universal Search Modal */}
      <AdminUniversalSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================
          MAIN LAYOUT BODY (3-Column Desktop Span OR Classic Full Admin Panel)
         ========================================================= */}
      {dashboardLayout === 'classic' ? (
        <div className="flex-1 overflow-auto w-full h-full bg-slate-950 relative">
          <AdminScreen onBack={onReturnToCustomerApp || onBack} />
        </div>
      ) : (
        <div className="flex-1 flex flex-row overflow-hidden w-full relative">

        {/* ---------------------------------------------------------
            COLUMN 1: LEFT COLUMN - ADMIN NAVIGATION SIDEBAR (Standalone Desktop)
           --------------------------------------------------------- */}
        <AdminSidebarNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileActiveColumn={mobileActiveColumn}
          setMobileActiveColumn={setMobileActiveColumn}
          productsCount={products.length}
          postsCount={posts.length}
          bannersCount={banners.length}
          ordersCount={orders.length}
          pendingOrdersCount={pendingOrdersCount}
          bloodDonorsCount={bloodDonors.length}
          complaintsCount={complaints.length}
          pendingSupportCount={pendingSupportCount}
          pendingModerationCount={pendingModerationCount}
        />

        {/* ---------------------------------------------------------
            COLUMN 2: FULL-SCREEN CORE MANAGEMENT WORKSPACE & FORMS
           --------------------------------------------------------- */}
        <main 
          className={`
            flex-1 bg-slate-100 text-slate-800 flex flex-col h-full overflow-y-auto min-w-0
            ${mobileActiveColumn === 'workspace' ? 'flex' : 'hidden md:flex'}
          `}
        >
          <div className="p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto space-y-6">

            {/* Quick Stats Metric Summary Bar (6-Card Comprehensive Operational Overview) */}
            <section aria-label="অ্যাডমিন দ্রুত মেট্রিক পরিসংখ্যান" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
              {/* Card 1: Total Products (Green / Emerald) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveTab('products');
                  setMobileActiveColumn('workspace');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('products');
                    setMobileActiveColumn('workspace');
                  }
                }}
                className={`group text-left p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
                  activeTab === 'products'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/15 bg-emerald-50/10'
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-emerald-700 transition">মোট পণ্য</span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 min-h-[32px]">
                  {isStatsLoading ? (
                    <div className="h-7 w-14 bg-slate-200 animate-pulse rounded-md"></div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {totalProductsCount.toLocaleString('bn-BD')}
                    </span>
                  )}
                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-1.5 py-0.2 rounded-md">
                    ক্যাটালগ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                  {isStatsLoading ? 'ডাটা সিঙ্ক হচ্ছে...' : `${publishedProductsCount.toLocaleString('bn-BD')}টি লাইভ পণ্য`}
                </p>
              </div>

              {/* Card 2: Active Orders (Sky Blue) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveTab('orders');
                  setMobileActiveColumn('workspace');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('orders');
                    setMobileActiveColumn('workspace');
                  }
                }}
                className={`group text-left p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
                  activeTab === 'orders'
                    ? 'border-sky-500 ring-2 ring-sky-500/15 bg-sky-50/10'
                    : 'border-slate-200/90 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-sky-700 transition">সক্রিয় অর্ডার</span>
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs group-hover:bg-sky-500 group-hover:text-white transition">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 min-h-[32px]">
                  {isStatsLoading ? (
                    <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {activeOrdersCount.toLocaleString('bn-BD')}
                    </span>
                  )}
                  {activeOrdersCount > 0 ? (
                    <span className="text-[9.5px] font-bold text-sky-700 bg-sky-100 border border-sky-200/80 px-1.5 py-0.2 rounded-md animate-pulse">
                      চলমান
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                      ০টি চলমান
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                  {isStatsLoading ? 'অর্ডার যাচাই হচ্ছে...' : `মোট ${orders.length.toLocaleString('bn-BD')}টি অর্ডারের তালিকা`}
                </p>
              </div>

              {/* Card 3: Total Active Sellers (Teal / Emerald - DB Query) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveTab('moderation');
                  setMobileActiveColumn('workspace');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('moderation');
                    setMobileActiveColumn('workspace');
                  }
                }}
                className={`group text-left p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
                  activeTab === 'moderation'
                    ? 'border-emerald-600 ring-2 ring-emerald-600/15 bg-emerald-50/10'
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-emerald-700 transition">মোট বিক্রেতা</span>
                  <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 min-h-[32px]">
                  {isStatsLoading ? (
                    <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {totalSellersCount.toLocaleString('bn-BD')}
                    </span>
                  )}
                  <span className="text-[9.5px] font-semibold text-teal-800 bg-teal-50 border border-teal-100/80 px-1.5 py-0.2 rounded-md">
                    মার্চেন্ট
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                  {isStatsLoading ? 'ডাটাবেস কোয়েরি চলছে...' : `${verifiedSellersCount.toLocaleString('bn-BD')} জন ভেরিফায়েড মার্চেন্ট`}
                </p>
              </div>

              {/* Card 4: Total Service Providers (Cyan / Blue - DB Query) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveTab('moderation');
                  setMobileActiveColumn('workspace');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('moderation');
                    setMobileActiveColumn('workspace');
                  }
                }}
                className={`group text-left p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
                  activeTab === 'moderation'
                    ? 'border-sky-500 ring-2 ring-sky-500/15 bg-sky-50/10'
                    : 'border-slate-200/90 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-sky-700 transition">মোট সেবা দাতা</span>
                  <div className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100 shadow-2xs group-hover:bg-cyan-600 group-hover:text-white transition">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 min-h-[32px]">
                  {isStatsLoading ? (
                    <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {totalServiceProvidersCount.toLocaleString('bn-BD')}
                    </span>
                  )}
                  <span className="text-[9.5px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-100/80 px-1.5 py-0.2 rounded-md">
                    সেবাদাতা
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                  {isStatsLoading ? 'ডাটাবেস কোয়েরি চলছে...' : `${verifiedProsCount.toLocaleString('bn-BD')} জন অনুমোদিত`}
                </p>
              </div>

              {/* Card 5: Registered Blood Donors (Rose / Red - DB Query) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveTab('blood_donors');
                  setMobileActiveColumn('workspace');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('blood_donors');
                    setMobileActiveColumn('workspace');
                  }
                }}
                className={`group text-left p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
                  activeTab === 'blood_donors'
                    ? 'border-rose-500 ring-2 ring-rose-500/15 bg-rose-50/10'
                    : 'border-slate-200/90 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-rose-700 transition">নিবন্ধিত রক্তদাতা</span>
                  <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs group-hover:bg-rose-500 group-hover:text-white transition">
                    <Droplet className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 min-h-[32px]">
                  {isStatsLoading ? (
                    <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {totalBloodDonorsCount.toLocaleString('bn-BD')}
                    </span>
                  )}
                  <span className="text-[9.5px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded-md">
                    রক্তদাতা
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                  {isStatsLoading ? 'ডাটাবেস কোয়েরি চলছে...' : totalBloodDonorsCount > 0 ? `${totalBloodDonorsCount.toLocaleString('bn-BD')} জন প্রস্তুত` : '০ জন নিবন্ধিত'}
                </p>
              </div>

              {/* Card 6: Live Visitor Traffic (Green / Emerald Interactive Pop-up Trigger) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsTrafficModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setIsTrafficModalOpen(true);
                  }
                }}
                className="group text-left p-3.5 rounded-2xl bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 border border-emerald-200/90 hover:border-emerald-400 hover:ring-2 hover:ring-emerald-500/20 transition-all cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-emerald-700 transition flex items-center gap-1.5">
                    <span>লাইভ ভিজিটর</span>
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 min-h-[32px]">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {liveVisitorCount.toLocaleString('bn-BD')}
                  </span>
                  <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.2 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                    <span>সক্রিয়</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                  <span className="truncate">আজকে {todayTotalVisits.toLocaleString('bn-BD')} ভিজিট</span>
                  <span className="text-emerald-600 font-bold group-hover:underline text-[9.5px] shrink-0">
                    বিশ্লেষণ ↗
                  </span>
                </div>
              </div>
            </section>

            {/* AI Command Center Quick Switcher Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-sm text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-900/30 shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black">ঝাদিমাদি AI বিজনেস ইন্টেলিজেন্স সক্রিয়</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Gemini 3.8 Flash
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    রিয়েল-টাইম স্টকআউট রিস্ক, অর্ডার অ্যানোমালি ও বিক্রয় প্রবৃদ্ধির বিশ্লেষণ প্রস্তুত
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {activeTab !== 'ai_command_center' ? (
                  <button
                    onClick={() => {
                      setActiveTab('ai_command_center');
                      setMobileActiveColumn('workspace');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>কমান্ড সেন্টার খুলুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-700/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>কমান্ড সেন্টার সক্রিয়</span>
                  </span>
                )}
              </div>
            </div>

            {/* TAB: AI SMART COMMAND CENTER & PERSONAL ASSISTANT */}
            {activeTab === 'ai_command_center' && (
              <AdminAiCommandCenter 
                onNavigateTab={(tab) => {
                  setActiveTab(tab as AdminWorkspaceTab);
                  setMobileActiveColumn('workspace');
                }}
                onShowToast={showToast}
              />
            )}

            {/* TAB: PRODUCTS CATALOG & FORM */}
            {activeTab === 'products' && (
              <AdminProductsTab 
                onShowToast={showToast} 
                initialImageUrl={galleryTargetAction === 'product' ? (gallerySelectedImageUrl || undefined) : undefined}
                onClearInitialImage={() => {
                  setGallerySelectedImageUrl(null);
                  setGalleryTargetAction(null);
                }}
              />
            )}

            {/* TAB: POSTS & COMMUNITY FEED */}
            {activeTab === 'posts' && (
              <AdminPostsTab onShowToast={showToast} />
            )}

            {/* TAB: CATEGORIES MANAGER */}
            {activeTab === 'categories' && (
              <CategoriesManagerTab 
                onSelectCategory={() => setActiveTab('products')}
                onAddNewProductWithCategory={() => setActiveTab('products')}
              />
            )}

            {/* TAB: SUPABASE CLOUD DATABASE */}
            {activeTab === 'supabase' && (
              <SupabaseDatabaseTab />
            )}

            {/* TAB: ORDERS & SALES */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                      কাস্টমার অর্ডার ও ডেলিভারি ট্র্যাকিং
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      গ্রাহকদের অর্ডার গ্রহণ, প্রসেসিং ও ডেলিভারি স্ট্যাটাস পরিচালনা করুন।
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                    মোট {orders.length}টি অর্ডার
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                    <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-sm">বর্তমানে কোনো সক্রিয় অর্ডার নেই</p>
                    <p className="text-xs text-slate-400 mt-1">কাস্টমাররা অর্ডার করলে তা এখানে রিয়েল-টাইমে প্রদর্শিত হবে।</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                          <tr>
                            <th className="p-3.5">অর্ডার আইডি</th>
                            <th className="p-3.5">গ্রাহক</th>
                            <th className="p-3.5">পণ্যসমূহ</th>
                            <th className="p-3.5">মোট মূল্য</th>
                            <th className="p-3.5">স্ট্যাটাস</th>
                            <th className="p-3.5 text-right">পদক্ষেপ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {orders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3.5 font-mono text-slate-900 font-bold">{order.id}</td>
                              <td className="p-3.5">
                                <div className="font-bold text-slate-800">{order.customerName || 'নাম নেই'}</div>
                                <div className="text-[11px] text-slate-400">{order.customerPhone || 'ফোন নেই'}</div>
                              </td>
                              <td className="p-3.5">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                                  {order.items?.length || 0} আইটেম
                                </span>
                              </td>
                              <td className="p-3.5 font-bold text-emerald-700">
                                ৳{(order.totalAmount || 0).toLocaleString('bn-BD')}
                              </td>
                              <td className="p-3.5">
                                <select
                                  value={order.status}
                                  onChange={e => {
                                    updateOrderStatus(order.id, e.target.value as any);
                                    showToast('✅ অর্ডারের স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে!');
                                  }}
                                  className="text-[11px] font-bold p-1 rounded-lg border border-slate-200 bg-white"
                                >
                                  <option value="Pending">অপেক্ষমাণ (Pending)</option>
                                  <option value="Confirmed">নিশ্চিত (Confirmed)</option>
                                  <option value="Shipped">পাঠানো হয়েছে (Shipped)</option>
                                  <option value="Delivered">ডেলিভারড (Delivered)</option>
                                  <option value="Cancelled">বাতিল (Cancelled)</option>
                                </select>
                              </td>
                              <td className="p-3.5 text-right font-mono text-[11px] text-slate-400">
                                {order.date || 'আজ'}
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

            {/* TAB: BANNERS */}
            {activeTab === 'banners' && (
              <AdminBannersTab 
                initialImageUrl={galleryTargetAction === 'banner' ? (gallerySelectedImageUrl || undefined) : undefined}
                onClearInitialImage={() => {
                  setGallerySelectedImageUrl(null);
                  setGalleryTargetAction(null);
                }}
              />
            )}

            {/* TAB: MEDIA LIBRARY & SUPABASE STORAGE BUCKET GALLERY */}
            {activeTab === 'media_library' && (
              <AdminMediaGalleryTab 
                onUseInProduct={(imageUrl) => {
                  setGallerySelectedImageUrl(imageUrl);
                  setGalleryTargetAction('product');
                  setActiveTab('products');
                  showToast('✅ ছবিটি সফলভাবে নির্বাচন করা হয়েছে! নতুন পণ্যের ফর্ম ওপেন হচ্ছে...');
                }}
                onUseInBanner={(imageUrl) => {
                  setGallerySelectedImageUrl(imageUrl);
                  setGalleryTargetAction('banner');
                  setActiveTab('banners');
                  showToast('✅ ছবিটি সফলভাবে নির্বাচন করা হয়েছে! নতুন ব্যানারের ফর্ম ওপেন হচ্ছে...');
                }}
                onShowToast={showToast}
              />
            )}

            {/* TAB: MODERATION & KYC */}
            {activeTab === 'moderation' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      পেশাজীবী ও কারিগর KYC অনুমোদন
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      রেজিস্ট্রেশনকৃত টেকনিশিয়ান ও সার্ভিস প্রোভাইডারদের জাতীয় পরিচয়পত্র ও তথ্য যাচাই করুন।
                    </p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    {pendingModerationCount} জন অপেক্ষমাণ
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professionals.map(pro => (
                    <div key={pro.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={pro.img || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                            alt={pro.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">{pro.name}</h3>
                            <p className="text-xs text-emerald-600 font-semibold">{pro.job}</p>
                          </div>
                        </div>
                        {pro.verified ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> অনুমোদিত
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> অপেক্ষমাণ
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div>ফোন: <strong className="text-slate-800">{pro.phone}</strong></div>
                        <div>এলাকা: <strong className="text-slate-800">{pro.upazila || pro.district || 'খাগড়াছড়ি'}</strong></div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        {!pro.verified ? (
                          <button
                            onClick={() => {
                              approveProfessional(pro.id);
                              showToast('✅ পেশাজীবী প্রোফাইল অনুমোদিত হয়েছে!');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> অনুমোদন করুন
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              rejectProfessional(pro.id);
                              showToast('⚠️ পেশাজীবী প্রোফাইল সাময়িক স্থগিত করা হয়েছে!');
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> বাতিল / স্থগিত
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: BLOOD DONORS */}
            {activeTab === 'blood_donors' && (
              <AdminBloodDonorsTab />
            )}

            {/* TAB: COMPLAINTS */}
            {activeTab === 'complaints' && (
              <AdminComplaintsTab />
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && (
              <AdminAnalyticsTab />
            )}

            {/* TAB: TRANSACTIONS */}
            {activeTab === 'transactions' && (
              <AdminTransactionsTab />
            )}

            {/* TAB: AI AUTOMATION */}
            {activeTab === 'ai_automation' && (
              <AdminAiAutomationTab />
            )}

            {/* TAB: SECURITY & CREDENTIAL MANAGEMENT */}
            {activeTab === 'security' && (
              <AdminAccountSecurityTab onRequireRelogin={onBack} />
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
              <AdminSettingsTab />
            )}

          </div>
        </main>

        {/* ---------------------------------------------------------
            COLUMN 3: OPTIONAL RIGHT COLUMN - REAL-TIME MOBILE VIEW / PREVIEW
           --------------------------------------------------------- */}
        {showLivePreview && (
          <section 
            className="w-full md:w-[425px] lg:w-[435px] xl:w-[450px] shrink-0 border-l border-slate-800 bg-slate-950 flex flex-col h-full overflow-hidden p-3 select-none"
          >
            {/* Preview Toolbar Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  লাইভ মোবাইল প্রিভিউ
                </span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded text-[9px] font-bold">
                  375 × 812
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Scale controls for responsive viewport fit */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[9px] font-bold text-slate-400">
                  <button
                    onClick={() => setPreviewScale(0.85)}
                    className={`px-1.5 py-0.5 rounded transition ${previewScale === 0.85 ? 'bg-emerald-600 text-white font-black' : 'hover:text-white'}`}
                    title="স্কেল ৮৫%"
                  >
                    85%
                  </button>
                  <button
                    onClick={() => setPreviewScale(0.95)}
                    className={`px-1.5 py-0.5 rounded transition ${previewScale === 0.95 ? 'bg-emerald-600 text-white font-black' : 'hover:text-white'}`}
                    title="স্কেল ৯৫%"
                  >
                    95%
                  </button>
                  <button
                    onClick={() => setPreviewScale(1)}
                    className={`px-1.5 py-0.5 rounded transition ${previewScale === 1 ? 'bg-emerald-600 text-white font-black' : 'hover:text-white'}`}
                    title="স্কেল ১০০%"
                  >
                    100%
                  </button>
                </div>

                {activeDraftPreview && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-2.5 h-2.5" /> ড্রাফট সিঙ্ক
                  </span>
                )}
                <button
                  onClick={handleReloadPreview}
                  disabled={isRefreshingPreview}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
                  title="প্রিভিউ রিফ্রেশ করুন"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingPreview ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
                <button
                  onClick={() => setShowLivePreview(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer ml-0.5"
                  title="প্রিভিউ বন্ধ করুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Tab Switcher inside Mobile Preview */}
            <div className="grid grid-cols-4 gap-1 mb-2 bg-slate-900 p-1 rounded-xl border border-slate-800/80 text-[10px] font-bold text-slate-300 shrink-0">
              <button
                onClick={() => setPreviewTab('home')}
                className={`py-1 rounded-lg transition ${previewTab === 'home' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-800'}`}
              >
                হোম
              </button>
              <button
                onClick={() => setPreviewTab('search')}
                className={`py-1 rounded-lg transition ${previewTab === 'search' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-800'}`}
              >
                সার্চ
              </button>
              <button
                onClick={() => setPreviewTab('services')}
                className={`py-1 rounded-lg transition ${previewTab === 'services' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-800'}`}
              >
                সেবা
              </button>
              <button
                onClick={() => setPreviewTab('profile')}
                className={`py-1 rounded-lg transition ${previewTab === 'profile' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-800'}`}
              >
                প্রোফাইল
              </button>
            </div>

            {/* Smartphone Frame Container - Strictly locked to standard 375px x 812px viewport */}
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start py-1 relative min-h-0">
              <div 
                data-preview-frame="true"
                className="box-content w-[375px] h-[812px] min-w-[375px] min-h-[812px] max-w-[375px] max-h-[812px] bg-black rounded-[44px] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col relative shrink-0 transition-transform duration-200"
                style={{
                  transform: previewScale !== 1 ? `scale(${previewScale})` : 'none',
                  transformOrigin: 'top center',
                  contain: 'paint layout',
                  isolation: 'isolate',
                }}
              >
                {/* Dynamic Island / Speaker */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-50 flex items-center justify-center pointer-events-none shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-black border border-slate-800 mr-2"></div>
                  <div className="w-6 h-1 bg-slate-700 rounded-full"></div>
                </div>

                {/* Scrollable Screen Content - Locked to strictly 375px width */}
                <div 
                  className="w-[375px] min-w-[375px] max-w-[375px] flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#faf9f6] pt-6 is-preview relative flex flex-col min-h-0"
                  style={{
                    transform: 'translateZ(0)',
                    contain: 'paint layout',
                    isolation: 'isolate',
                  }}
                >
                  <div className="w-[375px] min-w-[375px] max-w-[375px] h-full overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
                    <CustomerApp 
                      key={previewKey} 
                      initialTab={previewTab}
                      onNavigateToAdmin={() => {}}
                      isAdminPreview={true}
                    />
                  </div>
                </div>

                {/* Bottom Home Indicator */}
                <div className="h-4 bg-black shrink-0 flex items-center justify-center pointer-events-none z-50 relative">
                  <div className="w-28 h-1 bg-white/40 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-500">
              যেকোনো প্রোডাক্ট, পোস্ট বা ব্যানার এডিট করলে তা তাৎক্ষণিক এখানে সিঙ্ক হবে।
            </div>
          </section>
        )}

      </div>
      )}

      {/* Interactive Live Traffic Analytics Modal */}
      <LiveTrafficAnalyticsModal
        isOpen={isTrafficModalOpen}
        onClose={() => setIsTrafficModalOpen(false)}
      />

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default DesktopAdminDashboard;
