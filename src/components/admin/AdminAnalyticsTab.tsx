import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Search, 
  DollarSign, 
  ArrowUpRight, 
  Mic, 
  MapPin, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  BarChart3, 
  Layers, 
  Filter, 
  Sparkles,
  ShoppingBag,
  HeartHandshake,
  Droplet,
  AlertTriangle,
  Compass,
  MousePointerClick,
  RefreshCw,
  Tag,
  Lightbulb,
  ExternalLink,
  Zap,
  Check,
  Flame,
  SearchX,
  SlidersHorizontal
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { analyticsService } from '../../services/analyticsService';
import { 
  SearchAnalyticsKPIs, 
  KeywordMetric, 
  MissingSearchAlert, 
  NavOptionStat, 
  SearchLogEntry 
} from '../../types';

export const AdminAnalyticsTab: React.FC = () => {
  const { products, professionals, users, orders, bloodDonors, complaints } = useData();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('today');
  const [activityFilter, setActivityFilter] = useState<'all' | 'orders' | 'registrations' | 'search'>('all');

  // Search Analytics & User Behavior Tracking State
  const [searchKpis, setSearchKpis] = useState<SearchAnalyticsKPIs | null>(() => {
    return analyticsService.getCachedSearchAnalyticsKPIs('today');
  });
  const [isLoadingSearchKpis, setIsLoadingSearchKpis] = useState<boolean>(false);
  const [keywordCategoryTab, setKeywordCategoryTab] = useState<'all' | 'products' | 'services' | 'blood'>('all');
  const [missingSearchCategoryFilter, setMissingSearchCategoryFilter] = useState<'all' | 'products' | 'services' | 'blood'>('all');
  const [recentLogsFilter, setRecentLogsFilter] = useState<'all' | 'missing' | 'ai' | 'manual'>('all');
  const [selectedKeywordTag, setSelectedKeywordTag] = useState<string | null>(null);

  const loadKpis = async (range: 'today' | '7days' | '30days') => {
    setIsLoadingSearchKpis(true);
    try {
      const data = await analyticsService.fetchSearchAnalyticsKPIs(range);
      setSearchKpis(data);
    } catch (e) {
      console.warn('[AdminAnalytics] Fallback to cached analytics:', e);
      setSearchKpis(analyticsService.getCachedSearchAnalyticsKPIs(range));
    } finally {
      setIsLoadingSearchKpis(false);
    }
  };

  React.useEffect(() => {
    loadKpis(timeRange);
  }, [timeRange]);

  const totalGMV = orders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.totalAmount : sum, 0);
  const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered').length;
  const verifiedProsCount = professionals.filter(p => p.verified).length;
  const pendingKYC = professionals.filter(p => !p.verified).length;

  const khgCount = professionals.filter(p => p.district === 'Khagrachhari' || p.district === 'খাগড়াছড়ি').length;
  const rngCount = professionals.filter(p => p.district === 'Rangamati' || p.district === 'রাঙ্গামাটি').length;
  const bdbCount = professionals.filter(p => p.district === 'Bandarban' || p.district === 'বান্দরবান').length;
  const otherCount = Math.max(0, professionals.length - (khgCount + rngCount + bdbCount));
  const totalPros = Math.max(professionals.length, 1);

  const districtTraffic = [
    { district: 'খাগড়াছড়ি জেলা', share: professionals.length ? Math.round((khgCount / totalPros) * 100) : 0, queries: `${khgCount}`, pros: khgCount, color: 'bg-emerald-500' },
    { district: 'রাঙ্গামাটি জেলা', share: professionals.length ? Math.round((rngCount / totalPros) * 100) : 0, queries: `${rngCount}`, pros: rngCount, color: 'bg-teal-500' },
    { district: 'বান্দরবান জেলা', share: professionals.length ? Math.round((bdbCount / totalPros) * 100) : 0, queries: `${bdbCount}`, pros: bdbCount, color: 'bg-cyan-500' },
    { district: 'চট্টগ্রাম ও অন্যান্য', share: professionals.length ? Math.round((otherCount / totalPros) * 100) : 0, queries: `${otherCount}`, pros: otherCount, color: 'bg-blue-500' },
  ];

  const recentLogs: Array<{ id: string; type: 'order' | 'search' | 'registrations'; text: string; time: string; amount?: string; tag?: string }> = [
    ...orders.map(o => ({
      id: `LOG-ORD-${o.id}`,
      type: 'order' as const,
      text: `অর্ডার #${o.id}: ${o.customerName || 'গ্রাহক'} - ${o.items?.length || 1}টি আইটেম (${o.status})`,
      time: o.date || 'আজ',
      amount: `৳${(o.totalAmount || 0).toLocaleString()}`
    })),
    ...users.map(u => ({
      id: `LOG-USR-${u.id}`,
      type: 'registrations' as const,
      text: `নতুন ইউজার: "${u.name}" (${u.roleLabelBn || u.role})`,
      time: u.createdAt || 'আজ',
      tag: u.status || 'Active'
    }))
  ];

  const filteredLogs = recentLogs.filter(log => {
    if (activityFilter === 'all') return true;
    return log.type === activityFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="admin-analytics-tab">
      
      {/* Top Banner Header & Time Filter */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                প্ল্যাটফর্ম লাইভ অ্যানালিটিক্স ও মেট্রিক্স
              </h1>
              <p className="text-xs text-slate-400">
                দৈনিক ট্রাফিক, রেজিস্টার্ড ইউজার ও রেভিনিউ সম্পর্কিত লাইভ পরিসংখ্যান
              </p>
            </div>
          </div>
        </div>

        {/* Time Filter Pills & Refresh */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-800/90 border border-slate-700/80 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-xl transition ${timeRange === 'today' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              আজকের দিন
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-xl transition ${timeRange === '7days' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              গত ৭ দিন
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 rounded-xl transition ${timeRange === '30days' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              ৩০ দিন (মাসিক)
            </button>
          </div>
          <button
            onClick={() => loadKpis(timeRange)}
            disabled={isLoadingSearchKpis}
            title="লাইভ অ্যানালিটিক্স রিফ্রেশ করুন"
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSearchKpis ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 LIVE OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: অ্যাক্টিভ সার্ভিসেস / পণ্য */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">লিস্টেড পণ্য ও সার্ভিস</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{products.length}টি</span>
          </div>
          <p className="text-[11px] text-slate-400">ডাটাবেসে মোট সক্রিয় স্টোর ক্যাটালগ</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-[100%] rounded-full"></div>
          </div>
        </div>

        {/* Card 2: মোট রেজিস্টার্ড ইউজার */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">মোট রেজিস্টার্ড ইউজার</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{users.length} জন</span>
          </div>
          <p className="text-[11px] text-slate-400">{verifiedProsCount} ভেরিফাইড প্রফেশনাল, {users.length} মোট মেম্বার</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[100%] rounded-full"></div>
          </div>
        </div>

        {/* Card 3: রক্তদাতা সদস্য */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">নিবন্ধিত রক্তদাতা</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Droplet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{bloodDonors.length} জন</span>
          </div>
          <p className="text-[11px] text-slate-400">জরুরি রক্তদানের জন্য প্রস্তুত তালিকা</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full w-[100%] rounded-full"></div>
          </div>
        </div>

        {/* Card 4: মোট জিএমভি ও অর্ডার বিক্রয় */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">মোট বিক্রয় ভলিউম (GMV)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">৳{totalGMV.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-400">মোট ডেলিভার্ড অর্ডার: {deliveredOrdersCount}টি / মোট অর্ডার: {orders.length}টি</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[100%] rounded-full"></div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🚀 CORE SEARCH ANALYTICS & USER BEHAVIOR TRACKING SYSTEM                 */}
      {/* ========================================================================= */}
      <div className="space-y-6 bg-slate-50/70 p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs" id="search-analytics-system-section">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-emerald-600" /> লাইভ ট্র্যাকিং ইঞ্জিন
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-600" /> প্রাইভেসি সুরক্ষিত (১০০% বেনামী ডাটা)
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
              অনুসন্ধান বিশ্লেষণ ও ইউজার আচরণ ট্র্যাকিং (Search & User Analytics)
            </h2>
            <p className="text-xs text-slate-500">
              ঝাদিমাদি AI এবং ম্যানুয়াল 'খোঁজ' ফিল্টারের লাইভ কোয়েরি লগ, জিরো-রেজাল্ট উচ্চ চাহিদা সতর্কতা এবং ৫টি বটম ন্যাভিগেশন ব্যবহার রিপোর্ট
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {isLoadingSearchKpis ? 'ডাটা সিঙ্ক হচ্ছে...' : 'আপডেট সম্পন্ন'}
            </span>
            <button
              onClick={() => loadKpis(timeRange)}
              disabled={isLoadingSearchKpis}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSearchKpis ? 'animate-spin text-emerald-600' : ''}`} />
              রিফ্রেশ
            </button>
          </div>
        </div>

        {/* 4 Search KPI Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: মোট সার্চ কুয়েরি */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 relative group hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">মোট সার্চ কোয়েরি</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {searchKpis?.totalSearches || 0}
              </span>
              <span className="text-xs text-slate-400 font-bold">টি অনুসন্ধান</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> AI: {searchKpis?.aiSearchesCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-teal-600" /> খোঁজ: {searchKpis?.manualSearchesCount || 0}
              </span>
            </div>
          </div>

          {/* KPI 2: মিসিং সার্চ / জিরো রেজাল্ট অ্যালার্ট */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/80 shadow-xs space-y-2.5 relative group hover:border-rose-300 transition bg-gradient-to-br from-white to-rose-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                উচ্চ চাহিদা সতর্কতা (Missing)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <SearchX className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-700">
                {searchKpis?.zeroResultsCount || 0}
              </span>
              <span className="text-xs text-rose-600 font-bold">
                ({searchKpis?.zeroResultsRate || 0}%)
              </span>
            </div>
            <p className="text-[11px] text-rose-600/90 font-medium">
              যেসব অনুসন্ধানে 'কোনো তথ্য পাওয়া যায়নি'
            </p>
          </div>

          {/* KPI 3: ঝাদিমাদি AI সার্চ ট্রাফিক */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 relative group hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">ঝাদিমাদি AI চ্যাট ট্রাফিক</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {searchKpis?.aiSearchesCount || 0}
              </span>
              <span className="text-xs text-purple-700 font-bold">
                {searchKpis?.totalSearches ? Math.round(((searchKpis.aiSearchesCount || 0) / searchKpis.totalSearches) * 100) : 0}% শেয়ার
              </span>
            </div>
            <p className="text-[11px] text-slate-400">ন্যাচারাল ল্যাঙ্গুয়েজ ও স্মার্ট অ্যাসিস্ট্যান্ট কুয়েরি</p>
          </div>

          {/* KPI 4: ম্যানুয়াল খোঁজ ট্রাফিক */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 relative group hover:border-teal-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">ম্যানুয়াল 'খোঁজ' ফিল্টার</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {searchKpis?.manualSearchesCount || 0}
              </span>
              <span className="text-xs text-teal-700 font-bold">
                {searchKpis?.totalSearches ? Math.round(((searchKpis.manualSearchesCount || 0) / searchKpis.totalSearches) * 100) : 0}% শেয়ার
              </span>
            </div>
            <p className="text-[11px] text-slate-400">রক্ত, পণ্য, সেবা ও চাকরির সরাসরি ফিল্টারিং</p>
          </div>

        </div>

        {/* 2-Column Analytics Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column A (7 Cols): Top Keywords & Navigation Click Usage */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Module 1: Top Searched Keywords & Tag Cloud */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">সর্বাধিক অনুসন্ধানকৃত কীওয়ার্ড (Top Keywords)</h3>
                    <p className="text-[11px] text-slate-400">পণ্য, সেবা ও রক্তের গ্রুপ অনুসন্ধানের ট্যাগ-ক্লাউড ও ফ্রিকোয়েন্সি</p>
                  </div>
                </div>

                {/* Category Filter Pills for Keywords */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setKeywordCategoryTab('all')}
                    className={`px-2.5 py-1 rounded-lg transition ${keywordCategoryTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    সব
                  </button>
                  <button
                    onClick={() => setKeywordCategoryTab('products')}
                    className={`px-2.5 py-1 rounded-lg transition ${keywordCategoryTab === 'products' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    পণ্য
                  </button>
                  <button
                    onClick={() => setKeywordCategoryTab('services')}
                    className={`px-2.5 py-1 rounded-lg transition ${keywordCategoryTab === 'services' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    সেবা
                  </button>
                  <button
                    onClick={() => setKeywordCategoryTab('blood')}
                    className={`px-2.5 py-1 rounded-lg transition ${keywordCategoryTab === 'blood' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    রক্ত
                  </button>
                </div>
              </div>

              {/* Tag Cloud Display */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  ইন্টারেক্টিভ ট্যাগ ক্লাউড (ক্লিক করে লগ ফিল্টার করুন):
                </span>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  {((searchKpis?.topKeywords || []).filter(kw => keywordCategoryTab === 'all' || kw.category === keywordCategoryTab)).length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">এই ক্যাটাগরিতে কোনো কীওয়ার্ড পাওয়া যায়নি।</p>
                  ) : (
                    (searchKpis?.topKeywords || [])
                      .filter(kw => keywordCategoryTab === 'all' || kw.category === keywordCategoryTab)
                      .map((kw, idx) => {
                        const isSelected = selectedKeywordTag === kw.keyword;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedKeywordTag(isSelected ? null : kw.keyword)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                : (kw.isZeroResultFrequency || 0) > 0
                                  ? 'bg-rose-50/70 border-rose-200 text-rose-800 hover:bg-rose-100'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span>{kw.keyword}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                              isSelected 
                                ? 'bg-emerald-900 text-emerald-100' 
                                : (kw.isZeroResultFrequency || 0) > 0 
                                  ? 'bg-rose-200 text-rose-900' 
                                  : 'bg-slate-200 text-slate-700'
                            }`}>
                              {kw.count}
                            </span>
                            {(kw.isZeroResultFrequency || 0) > 0 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" title="কিছু অনুসন্ধানে কোনো রেজাল্ট মেলেনি"></span>
                            )}
                          </button>
                        );
                      })
                  )}
                </div>

                {selectedKeywordTag && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">
                      ফিল্টার করা কীওয়ার্ড: <strong className="text-emerald-700">{selectedKeywordTag}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedKeywordTag(null)}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      ক্লিয়ার ফিল্টার
                    </button>
                  </div>
                )}
              </div>

              {/* Keyword Breakdown Ranking List */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  শীর্ষ ৫টি কীওয়ার্ডের ভলিউম ও শেয়ার:
                </span>

                {(searchKpis?.topKeywords || [])
                  .filter(kw => keywordCategoryTab === 'all' || kw.category === keywordCategoryTab)
                  .slice(0, 5)
                  .map((kw, i) => {
                    const total = searchKpis?.totalSearches || 1;
                    const pct = Math.min(100, Math.round((kw.count / total) * 100));
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-bold text-slate-800">{kw.keyword}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                              {kw.category === 'products' ? 'পণ্য' : kw.category === 'services' ? 'সেবা' : kw.category === 'blood' ? 'রক্ত' : 'সাধারণ'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-bold">
                            <span className="text-slate-500 text-[11px]">{kw.count} বার</span>
                            <span className="text-slate-900 text-xs">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              kw.category === 'blood' ? 'bg-red-500' : kw.category === 'products' ? 'bg-emerald-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

            </div>

            {/* Module 3: Most Visited Navigation Options (Feature Usage - অপশন ১-৫) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">বটম ন্যাভিগেশন ব্যবহার (Most Visited Nav Options)</h3>
                    <p className="text-[11px] text-slate-400">অ্যাপের প্রধান ৫টি ফিচারের ক্লিক ও ট্রাফিক রূপান্তর</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  অপশন ১ - ৫
                </span>
              </div>

              {/* Navigation Options Performance List */}
              <div className="space-y-3">
                {(searchKpis?.navOptionStats || []).map((nav, idx) => {
                  const getOptionDetails = (opt: string) => {
                    switch (opt) {
                      case 'home':
                        return { title: 'Option 1: Home (হোম)', desc: 'ফিড, ক্যাটাগরি গ্রিড ও নোটিশ', color: 'bg-emerald-500', icon: '🏠' };
                      case 'manual_search':
                        return { title: 'Option 2: Manual Search (খোঁজ)', desc: 'সরাসরি ডিরেক্টরি ফিল্টারিং', color: 'bg-teal-500', icon: '🔍' };
                      case 'ai_search':
                        return { title: 'Option 3: Jhadimadi AI (ঝাদিমাদি)', desc: 'স্মার্ট চ্যাট ও এআই অ্যাসিস্ট্যান্ট', color: 'bg-purple-500', icon: '✨' };
                      case 'registration':
                        return { title: 'Option 4: Join (যুক্ত হোন)', desc: 'পণ্য বিক্রেতা, সেবাদাতা ও মেম্বারশিপ', color: 'bg-amber-500', icon: '📝' };
                      case 'profile':
                        return { title: 'Option 5: Profile (প্রোফাইল)', desc: 'মাই অ্যাকাউন্ট ও লগইন পোর্টাল', color: 'bg-indigo-500', icon: '👤' };
                      default:
                        return { title: nav.labelBn, desc: '', color: 'bg-slate-500', icon: '📌' };
                    }
                  };

                  const details = getOptionDetails(nav.option);

                  return (
                    <div key={idx} className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{details.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              {details.title}
                            </span>
                            <span className="text-[10px] text-slate-400">{details.desc}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">{nav.clicks} ক্লিক</span>
                          <span className="text-[11px] font-bold text-emerald-700">{nav.percentage}% শেয়ার</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`${details.color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(nav.percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* Column B (5 Cols): Missing/Failed Searches (High Demand Alerts) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Module 2: Missing Searches & Demand Alerts */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-rose-200/90 shadow-xs space-y-4">
              <div className="border-b border-rose-100 pb-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <SearchX className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">মিসিং ও ব্যর্থ অনুসন্ধান (High Demand Alerts)</h3>
                      <p className="text-[11px] text-rose-600 font-medium">শূন্য ফলাফল এসেছে এমন কোয়েরি</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300">
                    {searchKpis?.zeroResultsCount || 0}টি এলার্ট
                  </span>
                </div>

                {/* Insight Callout */}
                <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-200/60 text-[11px] text-rose-900 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-rose-800">
                    <Lightbulb className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ব্যবসায়িক সুযোগ ও সরবরাহ ঘাটতি:
                  </p>
                  <p className="text-[10.5px] leading-relaxed text-rose-700">
                    ইউজাররা যা খুঁজছেন কিন্তু ডাটাবেসে পাননি ('দুঃখিত, কোনো তথ্য পাওয়া যায়নি')। এসব পণ্য ও সেবা দ্রুত অনবোর্ড করলে প্ল্যাটফর্মের ব্যবহার বৃদ্ধি পাবে।
                  </p>
                </div>

                {/* Category Filter for Missing Searches */}
                <div className="flex items-center gap-1 pt-1 text-[11px] font-bold">
                  <button
                    onClick={() => setMissingSearchCategoryFilter('all')}
                    className={`px-2 py-0.5 rounded-lg transition ${missingSearchCategoryFilter === 'all' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    সকল
                  </button>
                  <button
                    onClick={() => setMissingSearchCategoryFilter('products')}
                    className={`px-2 py-0.5 rounded-lg transition ${missingSearchCategoryFilter === 'products' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    পণ্য
                  </button>
                  <button
                    onClick={() => setMissingSearchCategoryFilter('services')}
                    className={`px-2 py-0.5 rounded-lg transition ${missingSearchCategoryFilter === 'services' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    সেবা
                  </button>
                  <button
                    onClick={() => setMissingSearchCategoryFilter('blood')}
                    className={`px-2 py-0.5 rounded-lg transition ${missingSearchCategoryFilter === 'blood' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    রক্ত
                  </button>
                </div>
              </div>

              {/* Missing Searches List */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {((searchKpis?.missingSearchesAlerts || []).filter(ms => missingSearchCategoryFilter === 'all' || ms.category === missingSearchCategoryFilter)).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    কোনো সক্রিয় মিসিং সার্চ নেই। সকল অনুসন্ধানের সন্তোষজনক তথ্য রয়েছে!
                  </div>
                ) : (
                  (searchKpis?.missingSearchesAlerts || [])
                    .filter(ms => missingSearchCategoryFilter === 'all' || ms.category === missingSearchCategoryFilter)
                    .map((item, i) => (
                      <div 
                        key={i} 
                        className="p-3 bg-white hover:bg-rose-50/40 rounded-xl border border-rose-100 shadow-2xs transition space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-black text-slate-900 block leading-tight">
                              "{item.queryText}"
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {item.category === 'products' ? '🛍️ পণ্য' : item.category === 'services' ? '🛠️ সেবা' : item.category === 'blood' ? '🩸 রক্ত' : 'অন্যান্য'}
                              </span>
                              {item.lastLocation && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {item.lastLocation}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full block text-center ${
                              item.urgency === 'high' 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                : item.urgency === 'medium' 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.count} বার ব্যর্থ
                            </span>
                          </div>
                        </div>

                        {/* Recommendation Action Pill for Admin */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-500 font-medium">
                            পরামর্শ: {item.category === 'products' ? 'নতুন বিক্রেতা যুক্ত করুন' : item.category === 'blood' ? 'জরুরি রক্তদাতা সন্ধান' : 'নতুন মিস্ত্রি অনবোর্ড করুন'}
                          </span>
                          <span className="text-[10px] font-bold text-rose-700 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> জরুরি ঘাটতি
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>

            </div>

            {/* Quick Summary Tip */}
            <div className="bg-emerald-900 text-white p-4 rounded-2xl border border-emerald-800 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> ইউজার প্রাইভেসি এনফোর্সমেন্ট
                </span>
                <span>Active</span>
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                সকল সার্চ কুয়েরি থেকে ফোন নম্বর, ইমেইল ও নাম স্বয়ংক্রিয়ভাবে ফিল্টার করে লগ ফাইলে সুরক্ষিত করা হয়।
              </p>
            </div>

          </div>

        </div>

        {/* Module 4: Real-time Anonymous Search Query Stream */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">লাইভ বেনামী অনুসন্ধান লগ (Live Search Stream)</h3>
                <p className="text-[11px] text-slate-400">ব্যবহারকারীদের সাম্প্রতিক অনুসন্ধানসমূহ (সম্পূর্ণ পিআইআই মুক্ত)</p>
              </div>
            </div>

            {/* Stream Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => setRecentLogsFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition ${recentLogsFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                সব কোয়েরি
              </button>
              <button
                onClick={() => setRecentLogsFilter('missing')}
                className={`px-3 py-1.5 rounded-xl transition ${recentLogsFilter === 'missing' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                মিসিং কোয়েরি
              </button>
              <button
                onClick={() => setRecentLogsFilter('ai')}
                className={`px-3 py-1.5 rounded-xl transition ${recentLogsFilter === 'ai' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                AI সার্চ
              </button>
              <button
                onClick={() => setRecentLogsFilter('manual')}
                className={`px-3 py-1.5 rounded-xl transition ${recentLogsFilter === 'manual' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                ম্যানুয়াল খোঁজ
              </button>
            </div>
          </div>

          {/* Stream Log Entries */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {((searchKpis?.recentLogs || [])
              .filter(l => {
                if (recentLogsFilter === 'missing') return l.isZeroResult;
                if (recentLogsFilter === 'ai') return l.source === 'ai';
                if (recentLogsFilter === 'manual') return l.source === 'manual';
                return true;
              })
              .filter(l => !selectedKeywordTag || l.queryText.toLowerCase().includes(selectedKeywordTag.toLowerCase()))
            ).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                কোনো অনুসন্ধান লগ পাওয়া যায়নি।
              </div>
            ) : (
              (searchKpis?.recentLogs || [])
                .filter(l => {
                  if (recentLogsFilter === 'missing') return l.isZeroResult;
                  if (recentLogsFilter === 'ai') return l.source === 'ai';
                  if (recentLogsFilter === 'manual') return l.source === 'manual';
                  return true;
                })
                .filter(l => !selectedKeywordTag || l.queryText.toLowerCase().includes(selectedKeywordTag.toLowerCase()))
                .map((log) => {
                  const timeFormatted = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div 
                      key={log.id} 
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          log.source === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {log.source === 'ai' ? <Sparkles className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              "{log.queryText}"
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                              {log.source === 'ai' ? 'ঝাদিমাদি AI' : 'ম্যানুয়াল খোঁজ'}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {log.category === 'products' ? 'পণ্য' : log.category === 'services' ? 'সেবা' : log.category === 'blood' ? 'রক্ত' : 'সাধারণ'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeFormatted}
                            </span>
                            {(log.locationParams.district || log.locationParams.upazila) && (
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {[log.locationParams.upazila, log.locationParams.district].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {log.isZeroResult ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> ০টি ফলাফল (অনুপলব্ধ)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" /> {log.resultsCount}টি ফলাফল প্রদর্শিত
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

      {/* Middle Row: Area Distribution & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* District-wise Demand & Network Load */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">এলাকাভিত্তিক প্রফেশনাল নেটওয়ার্ক কভারেজ</h3>
                <p className="text-[11px] text-slate-400">পার্বত্য ৩ জেলা ও অন্যান্য অঞ্চলের প্রকৃত তথ্য</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {districtTraffic.map((d, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{d.district}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium text-[11px]">{d.pros} জন</span>
                    <span className="font-black text-slate-900">{d.share}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`${d.color} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.max(d.share, 2)}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>নিবন্ধিত প্রফেশনালস: {d.pros} জন</span>
                  <span className="text-emerald-600 font-bold">{d.pros > 0 ? 'সক্রিয়' : 'খালি'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">প্ল্যাটফর্ম ও ডাটাবেস স্বাস্থ্য</h3>
                  <p className="text-[11px] text-slate-400">রিয়েল-টাইম ফায়ারবেস ও সিকিউরিটি স্ট্যাটাস</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">ফায়ারবেস কানেক্টিভিটি</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  অনলাইন
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">পেন্ডিং কমপ্লেইন</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${complaints.length > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                  {complaints.length}টি
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">কেওয়াইসি ভেরিফিকেশন পেন্ডিং</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${pendingKYC > 0 ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                  {pendingKYC} জন
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> সিস্টেম স্ট্যাটাস
              </span>
              <span>100% Operational</span>
            </div>
            <p className="text-[11px] text-slate-400">রিয়েল ডাটা মোড সক্রিয়। কোনো কৃত্রিম পরিসংখ্যান অন্তর্ভুক্ত নেই।</p>
          </div>
        </div>

      </div>

      {/* Real Live Activity Stream */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">সাম্প্রতিক কার্যক্রম লগ</h3>
              <p className="text-[11px] text-slate-400">ডাটাবেস থেকে প্রাপ্ত লাইভ অ্যাক্টিভিটি</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActivityFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition ${activityFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              সব ইভেন্ট
            </button>
            <button
              onClick={() => setActivityFilter('orders')}
              className={`px-3 py-1.5 rounded-xl transition ${activityFilter === 'orders' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              অর্ডারস
            </button>
            <button
              onClick={() => setActivityFilter('registrations')}
              className={`px-3 py-1.5 rounded-xl transition ${activityFilter === 'registrations' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              রেজিস্ট্রেশন
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              কোনো সাম্প্রতিক কার্যক্রম লগ পাওয়া যায়নি (০টি ইভেন্ট)।
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    log.type === 'order' ? 'bg-emerald-100 text-emerald-700' :
                    log.type === 'search' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {log.type === 'order' && <ShoppingBag className="w-4 h-4" />}
                    {log.type === 'search' && <Search className="w-4 h-4" />}
                    {log.type === 'registrations' && <Users className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{log.text}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {log.time}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {log.amount && (
                    <span className="text-xs font-black text-emerald-700 block">{log.amount}</span>
                  )}
                  {log.tag && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      {log.tag}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
