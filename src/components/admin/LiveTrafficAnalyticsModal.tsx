import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  Calendar, 
  RefreshCw, 
  X, 
  Smartphone, 
  Monitor, 
  Tablet, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  ArrowUpRight,
  BarChart2,
  Layers,
  Flame,
  Radio
} from 'lucide-react';
import { analyticsService, LiveTrafficStats, MinuteTrendPoint, HourlyTrendPoint, DailyTrendPoint, PeakPeriodBreakdown } from '../../services/analyticsService';

interface LiveTrafficAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveTrafficAnalyticsModal: React.FC<LiveTrafficAnalyticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'minute' | 'hourly' | 'daily'>('minute');
  const [stats, setStats] = useState<LiveTrafficStats>(() => analyticsService.getLiveTrafficStats());
  const [minuteData, setMinuteData] = useState<MinuteTrendPoint[]>(() => analyticsService.getMinuteTrendData(30));
  const [hourlyData, setHourlyData] = useState<HourlyTrendPoint[]>(() => analyticsService.getHourlyTrendData());
  const [dailyData, setDailyData] = useState<DailyTrendPoint[]>(() => analyticsService.getDailyTrendData(7));
  const [peakPeriods, setPeakPeriods] = useState<PeakPeriodBreakdown[]>(() => analyticsService.getPeakHoursBreakdown());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<string | null>(null);

  // Subscribe to live telemetry heartbeats
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = analyticsService.subscribeLiveTraffic((newStats) => {
      setStats(newStats);
      setMinuteData(analyticsService.getMinuteTrendData(30));
      setHourlyData(analyticsService.getHourlyTrendData());
      setDailyData(analyticsService.getDailyTrendData(7));
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setStats(analyticsService.getLiveTrafficStats());
    setMinuteData(analyticsService.getMinuteTrendData(30));
    setHourlyData(analyticsService.getHourlyTrendData());
    setDailyData(analyticsService.getDailyTrendData(7));
    setPeakPeriods(analyticsService.getPeakHoursBreakdown());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Peak hour calculations
  const highestHourly = useMemo(() => {
    return hourlyData.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyData[0] || { count: 0, hourLabel: '08:00 PM' });
  }, [hourlyData]);

  const maxMinuteCount = useMemo(() => {
    return Math.max(...minuteData.map(d => d.count), 1);
  }, [minuteData]);

  const maxHourlyCount = useMemo(() => {
    return Math.max(...hourlyData.map(d => d.count), 1);
  }, [hourlyData]);

  const maxDailyCount = useMemo(() => {
    return Math.max(...dailyData.map(d => d.count), 1);
  }, [dailyData]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="traffic-modal-title"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 my-auto"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="traffic-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  লাইভ ভিজিটর ট্রাফিক ও প্ল্যাটফর্ম অ্যানালিটিক্স
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  রিয়েল-টাইম লাইভ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                মিনিট-লেভেল ট্রেন্ড, পিক-আওয়ার্স ও ২৪ ঘণ্টার ট্রাফিক পর্যালোচনা • শেষ আপডেট: {stats.lastUpdated}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="তথ্য রিফ্রেশ করুন"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            <button
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 flex items-center justify-center border border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* 1. TOP STATS 4-GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Active Now Card */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-800/60 to-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  এখন সক্রিয় ভিজিটর
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {stats.activeNow.toLocaleString('bn-BD')}
                </span>
                <span className="text-xs font-semibold text-emerald-300">জন অনলাইন</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                গত ৫ মিনিটের মধ্যে সক্রিয় প্ল্যাটফর্ম সেশন
              </p>
            </div>

            {/* Today's Total Visits */}
            <div className="bg-gradient-to-br from-sky-950/40 via-slate-800/60 to-slate-900/80 border border-sky-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-sky-400 tracking-wide uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                  আজকের মোট ভিজিট
                </span>
                <span className="text-[10px] font-bold text-sky-300 bg-sky-500/15 px-1.5 py-0.5 rounded">
                  +১৪% বৃদ্ধি
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {stats.todayTotal.toLocaleString('bn-BD')}
                </span>
                <span className="text-xs font-semibold text-sky-300">বার এন্ট্রি</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                ইউনিক ভিজিটর: ~{stats.uniqueVisitorsToday.toLocaleString('bn-BD')} জন
              </p>
            </div>

            {/* Peak Hour Breakdown */}
            <div className="bg-gradient-to-br from-amber-950/40 via-slate-800/60 to-slate-900/80 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-400 tracking-wide uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  পিক আওয়ার ট্রাফিক
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
                  সন্ধ্যা
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {stats.peakHourWindow}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                সর্বোচ্চ পিক: {stats.peakHourVisitors.toLocaleString('bn-BD')} জন সমসাময়িক ভিজিটর
              </p>
            </div>

            {/* Engagement & Session Time */}
            <div className="bg-gradient-to-br from-indigo-950/40 via-slate-800/60 to-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-indigo-400 tracking-wide uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  গড় সেশন স্থায়িত্ব
                </span>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded">
                  এঙ্গেজড
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {stats.avgSessionDuration}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                গড় ব্রাউজিং: প্রতি সেশনে {stats.pagesPerSession.toLocaleString('bn-BD')}টি স্ক্রিন
              </p>
            </div>

          </div>

          {/* 2. INTERACTIVE TREND TABS & VISUAL CHART */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl">
            {/* Tab navigation */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  ভিজিটর ট্রেন্ড ও গ্রাফ ভিউ
                </h3>
              </div>

              <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setActiveTab('minute')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'minute'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  মিনিট-লেভেল (গত ৩০ মি.)
                </button>
                <button
                  onClick={() => setActiveTab('hourly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'hourly'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ঘণ্টা-লেভেল (২৪ ঘণ্টা)
                </button>
                <button
                  onClick={() => setActiveTab('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'daily'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  দৈনিক ট্রেন্ড (৭ দিন)
                </button>
              </div>
            </div>

            {/* TAB 1: MINUTE-LEVEL TREND */}
            {activeTab === 'minute' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>প্রতি মিনিটের অ্যাক্টিভ ট্রাফিক লেভেল</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    এখন: {stats.activeNow.toLocaleString('bn-BD')} জন
                  </span>
                </div>

                {/* Minute Visual Bar Chart */}
                <div className="h-44 sm:h-52 flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-2 bg-slate-900/60 rounded-xl border border-slate-700/40 relative">
                  {minuteData.map((pt, idx) => {
                    const heightPercent = Math.max(8, Math.round((pt.count / maxMinuteCount) * 100));
                    const isHovered = hoveredDataPoint === `min_${idx}`;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                        onMouseEnter={() => setHoveredDataPoint(`min_${idx}`)}
                        onMouseLeave={() => setHoveredDataPoint(null)}
                      >
                        {/* Tooltip on hover */}
                        {isHovered && (
                          <div className="absolute -top-12 z-20 bg-slate-950 border border-emerald-500/50 text-white text-[11px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">
                            <span className="text-emerald-400">{pt.timeLabel}:</span> {pt.count.toLocaleString('bn-BD')} জন
                          </div>
                        )}

                        <div 
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            pt.active 
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                              : isHovered
                              ? 'bg-sky-400'
                              : 'bg-gradient-to-t from-slate-700 to-slate-600 hover:from-sky-600 hover:to-sky-400'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />

                        {/* Bottom minute label for key markers */}
                        {(idx === 0 || idx === 10 || idx === 20 || idx === minuteData.length - 1) && (
                          <span className="text-[9px] text-slate-400 mt-1 font-mono absolute -bottom-5">
                            {idx === minuteData.length - 1 ? 'এখন' : pt.timeLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/40 flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-400 shadow-sm" /> বর্তমান মিনিট (লাইভ)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-600" /> বিগত মিনিট
                    </span>
                  </div>
                  <span className="font-semibold text-slate-300">
                    সর্বোচ্চ ট্রাফিক মিনিট: {maxMinuteCount.toLocaleString('bn-BD')} জন
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: HOURLY-LEVEL TREND (24-HOURS) */}
            {activeTab === 'hourly' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>২৪ ঘণ্টার ট্রাফিক বণ্টন (০০:০০ - ২৩:০০)</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    শীর্ষ পিক: {highestHourly.hourLabel} ({highestHourly.count.toLocaleString('bn-BD')} জন)
                  </span>
                </div>

                {/* Hourly 24-Bar Visual Chart */}
                <div className="h-48 sm:h-56 flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-2 bg-slate-900/60 rounded-xl border border-slate-700/40 relative">
                  {hourlyData.map((pt) => {
                    const heightPercent = Math.max(6, Math.round((pt.count / maxHourlyCount) * 100));
                    const isHovered = hoveredDataPoint === `hr_${pt.hour}`;

                    return (
                      <div
                        key={pt.hour}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                        onMouseEnter={() => setHoveredDataPoint(`hr_${pt.hour}`)}
                        onMouseLeave={() => setHoveredDataPoint(null)}
                      >
                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 z-20 bg-slate-950 border border-sky-500/50 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                            <div className="text-sky-400">{pt.hourLabel}</div>
                            <div className="text-xs">{pt.count.toLocaleString('bn-BD')} জন ভিজিটর</div>
                          </div>
                        )}

                        <div 
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            pt.isPeak 
                              ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-sky-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                              : isHovered
                              ? 'bg-sky-400'
                              : 'bg-gradient-to-t from-slate-700 to-slate-500'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />

                        {/* Hour Label */}
                        {(pt.hour % 3 === 0) && (
                          <span className="text-[9px] text-slate-400 mt-1 font-mono absolute -bottom-5">
                            {pt.hourLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/40 flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500" /> পিক ট্রাফিক আওয়ার
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-600" /> অফ-পিক সাধারণ সময়
                    </span>
                  </div>
                  <span className="font-semibold text-slate-300">
                    গড় প্রতি ঘণ্টা: {Math.round(stats.todayTotal / 24).toLocaleString('bn-BD')} জন
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: DAILY TREND (7-DAYS) */}
            {activeTab === 'daily' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>বিগত ৭ দিনের ভিজিটর হিস্ট্রি ও প্রবৃদ্ধি</span>
                  <span className="text-sky-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    ৭ দিনের মোট: {dailyData.reduce((s, c) => s + c.count, 0).toLocaleString('bn-BD')} জন
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {dailyData.map((d, i) => {
                    const isToday = i === 0;
                    return (
                      <div 
                        key={d.date}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          isToday 
                            ? 'bg-emerald-950/40 border-emerald-500/40 shadow-md' 
                            : 'bg-slate-900/60 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[11px] font-bold ${isToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {d.dateLabel}
                          </span>
                          {d.growthPercent && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">
                              +{d.growthPercent}%
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{d.dayOfWeek}</span>
                        <div className="mt-3 text-lg font-black text-white">
                          {d.count.toLocaleString('bn-BD')}
                          <span className="text-[10px] font-normal text-slate-400 ml-1">ভিজিট</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* 3. PEAK TRAFFIC HOURS BREAKDOWN */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700/60 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    পিক ট্রাফিক সময় বিশ্লেষণ ও সার্ভার রেসপন্স রেট
                  </h3>
                  <p className="text-xs text-slate-400">
                    দৈনন্দিন সর্বোচ্চ চাপ ও ব্যবহারকারীর অ্যাক্টিভিটি সময়সীমা
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  সার্ভার আপটাইম: ৯৯.৯৪%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {peakPeriods.map((period, idx) => {
                const isTopPeak = period.status === 'Peak';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isTopPeak 
                        ? 'bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/30 shadow-md' 
                        : 'bg-slate-900/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isTopPeak ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {period.period}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isTopPeak 
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {period.timeWindow}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {period.descriptionBn}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>মোট শেয়ার:</span>
                        <span className="font-bold text-white">{period.trafficSharePercent}%</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>গড় সমসাময়িক:</span>
                        <span className="font-bold text-emerald-400">{period.avgVisitorsPerHour.toLocaleString('bn-BD')} জন/ঘণ্টা</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isTopPeak ? 'bg-amber-400' : 'bg-sky-500'}`}
                        style={{ width: `${period.trafficSharePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. REGIONAL & DEVICE DISTRIBUTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* District Breakdown */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  আঞ্চলিক ভিজিটর বিস্তৃতি (পার্বত্য জেলাসমূহ)
                </span>
                <span className="text-[10px] text-slate-400">সিএইচটি নেটওয়ার্ক</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'খাগড়াছড়ি সদর ও উপজেলাসমূহ', percent: 38, count: Math.round(stats.todayTotal * 0.38) },
                  { name: 'রাঙ্গামাটি সদর ও কাপ্তাই', percent: 26, count: Math.round(stats.todayTotal * 0.26) },
                  { name: 'বান্দরবান ও রুমা', percent: 18, count: Math.round(stats.todayTotal * 0.18) },
                  { name: 'চট্টগ্রাম ও পার্শ্ববর্তী এলাকা', percent: 12, count: Math.round(stats.todayTotal * 0.12) },
                  { name: 'ঢাকা ও অন্যান্য প্রান্ত', percent: 6, count: Math.round(stats.todayTotal * 0.06) },
                ].map((item, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span>{item.name}</span>
                      <span className="font-bold text-white">{item.count.toLocaleString('bn-BD')} জন ({item.percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-sky-500 h-full rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Distribution */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  ডিভাইস ও ব্রাউজার ডিস্ট্রিবিউশন
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">মোবাইল-ফার্স্ট</span>
              </div>

              <div className="space-y-3.5">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold">মোবাইল ব্রাউজার / ইনস্টলড PWA</span>
                    </div>
                    <span className="font-black text-emerald-400">৮৪%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '84%' }} />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Monitor className="w-4 h-4 text-sky-400" />
                      <span className="font-bold">ডেস্কটপ ও ল্যাপটপ</span>
                    </div>
                    <span className="font-black text-sky-400">১৩%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: '13%' }} />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Tablet className="w-4 h-4 text-purple-400" />
                      <span className="font-bold">ট্যাবলেট ও আইপ্যাড</span>
                    </div>
                    <span className="font-black text-purple-400">৩%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '3%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>লাইভ সেশন সিঙ্ক্রোনাইজেশন প্রতি ৫ সেকেন্ডে স্বয়ংক্রিয়ভাবে রিফ্রেশ হয়।</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
