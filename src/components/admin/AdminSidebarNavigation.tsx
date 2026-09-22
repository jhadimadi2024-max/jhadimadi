import React from 'react';
import { 
  Bot, Package, MessageSquare, Layers, Image as ImageIcon, 
  ShoppingCart, Droplet, ShieldAlert, Database, ShieldCheck, 
  CreditCard, BarChart3, Settings, FolderOpen
} from 'lucide-react';
import type { AdminWorkspaceTab } from './DesktopAdminDashboard';

interface AdminSidebarNavigationProps {
  activeTab: AdminWorkspaceTab;
  setActiveTab: (tab: AdminWorkspaceTab) => void;
  mobileActiveColumn: 'menu' | 'workspace';
  setMobileActiveColumn: (col: 'menu' | 'workspace') => void;
  productsCount: number;
  postsCount: number;
  bannersCount: number;
  ordersCount: number;
  pendingOrdersCount: number;
  bloodDonorsCount: number;
  complaintsCount: number;
  pendingSupportCount: number;
  pendingModerationCount: number;
}

export const AdminSidebarNavigation: React.FC<AdminSidebarNavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileActiveColumn,
  setMobileActiveColumn,
  productsCount,
  postsCount,
  bannersCount,
  ordersCount,
  pendingOrdersCount,
  bloodDonorsCount,
  complaintsCount,
  pendingSupportCount,
  pendingModerationCount,
}) => {
  const handleSelectTab = (tab: AdminWorkspaceTab) => {
    setActiveTab(tab);
    setMobileActiveColumn('workspace');
  };

  return (
    <aside 
      className={`
        w-full md:w-64 lg:w-72 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col h-full overflow-hidden select-none z-10
        ${mobileActiveColumn === 'menu' ? 'flex' : 'hidden md:flex'}
      `}
    >
      {/* Menu Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          অ্যাডমিন কন্ট্রোল সেন্টার
        </span>
        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
          রিয়েল-টাইম
        </span>
      </div>

      {/* Navigation Links Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">

        {/* 🌟 AI SMART COMMAND CENTER (FEATURED AT TOP) */}
        <div>
          <button
            onClick={() => handleSelectTab('ai_command_center')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black transition cursor-pointer border ${
              activeTab === 'ai_command_center'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/30'
                : 'bg-gradient-to-r from-slate-900 to-slate-950 text-emerald-300 hover:text-white border-emerald-500/30 hover:border-emerald-500/70 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block leading-tight font-black">AI কমান্ড সেন্টার</span>
                <span className="text-[9.5px] font-medium text-emerald-400/80">স্মার্ট বিজনেস কো-পাইলট</span>
              </div>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse">
              AI LIVE
            </span>
          </button>
        </div>

        {/* Group 1: কোর ক্যাটালগ ও ফিড */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-1.5">
            কোর ক্যাটালগ ও ফিড
          </div>
          <div className="space-y-1">
            {/* 1. Products */}
            <button
              onClick={() => handleSelectTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>পণ্য ও স্টক</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'products' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {productsCount}
              </span>
            </button>

            {/* 2. Posts (Community Feed) */}
            <button
              onClick={() => handleSelectTab('posts')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'posts'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>কমিউনিটি ফিড ও পোস্ট</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'posts' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {postsCount}
              </span>
            </button>

            {/* 3. Categories */}
            <button
              onClick={() => handleSelectTab('categories')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>ক্যাটাগরি ম্যানেজার</span>
              </div>
            </button>

            {/* 4. Banners */}
            <button
              onClick={() => handleSelectTab('banners')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'banners'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4" />
                <span>ব্যানার ও প্রোমো</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'banners' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {bannersCount}
              </span>
            </button>

            {/* 5. Media Library / Bucket Gallery */}
            <button
              onClick={() => handleSelectTab('media_library')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'media_library'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>মিডিয়া লাইব্রেরি / গ্যালারি</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Storage
              </span>
            </button>
          </div>
        </div>

        {/* Group 2: অর্ডার ও কাস্টমার সার্ভিস */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-1.5">
            অর্ডার ও গ্রাহক সেবা
          </div>
          <div className="space-y-1">
            {/* Orders */}
            <button
              onClick={() => handleSelectTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-sky-400" />
                <span>কাস্টমার অর্ডার</span>
              </div>
              <div className="flex items-center gap-1.5">
                {pendingOrdersCount > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500 text-white font-mono shadow-xs animate-pulse">
                    {pendingOrdersCount} পেন্ডিং
                  </span>
                )}
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'orders' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {ordersCount}
                </span>
              </div>
            </button>

            {/* Blood Donors */}
            <button
              onClick={() => handleSelectTab('blood_donors')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'blood_donors'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Droplet className="w-4 h-4 text-rose-400" />
                <span>রক্তদাতা নেটওয়ার্ক</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'blood_donors' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {bloodDonorsCount}
              </span>
            </button>

            {/* Complaints */}
            <button
              onClick={() => handleSelectTab('complaints')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>অভিযোগ ও সাপোর্ট</span>
              </div>
              <div className="flex items-center gap-1.5">
                {pendingSupportCount > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono shadow-xs animate-pulse">
                    {pendingSupportCount} নতুন
                  </span>
                )}
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'complaints' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {complaintsCount}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Group 3: সুপাবেস ও ভেরিফিকেশন */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-1.5">
            সুপাবেস ও ভেরিফিকেশন
          </div>
          <div className="space-y-1">
            {/* Supabase Database */}
            <button
              onClick={() => handleSelectTab('supabase')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'supabase'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>সুপাবেস ডাটাবেস</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                LIVE
              </span>
            </button>

            {/* Moderation / KYC */}
            <button
              onClick={() => handleSelectTab('moderation')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'moderation'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>পেশাজীবী ভেরিফিকেশন</span>
              </div>
              {pendingModerationCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                  {pendingModerationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Group 4: অ্যানালিটিক্স ও সিস্টেম */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-1.5">
            অ্যানালিটিক্স ও সিস্টেম
          </div>
          <div className="space-y-1">
            {/* AI Automation */}
            <button
              onClick={() => handleSelectTab('ai_automation')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'ai_automation'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>এআই অটোমেশন</span>
              </div>
            </button>

            {/* Transactions */}
            <button
              onClick={() => handleSelectTab('transactions')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>আয় ও লেনদেন</span>
              </div>
            </button>

            {/* Analytics */}
            <button
              onClick={() => handleSelectTab('analytics')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>রিপোর্ট ও অ্যানালিটিক্স</span>
              </div>
            </button>

            {/* Security & Credentials */}
            <button
              onClick={() => handleSelectTab('security')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ক্রেডেনশিয়াল ও সিকিউরিটি</span>
              </div>
            </button>

            {/* Settings */}
            <button
              onClick={() => handleSelectTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>সিস্টেম সেটিংস</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Footer Status Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            সুপাবেস রিয়েল-টাইম
          </span>
          <span className="font-mono text-emerald-400 font-bold">কানেক্টেড</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          ঝাদিমাদি প্ল্যাটফর্ম সংস্করণ ৩.০ (গ্লোবাল সিঙ্ক)
        </div>
      </div>
    </aside>
  );
};
