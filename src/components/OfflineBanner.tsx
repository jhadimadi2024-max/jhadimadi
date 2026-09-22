import React from 'react';
import { WifiOff, Wifi, RefreshCw, Database, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
  isChecking: boolean;
  onRetry: () => void;
  cachedCount?: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  wasOffline,
  isChecking,
  onRetry,
  cachedCount = 24,
}) => {
  return (
    <div className="w-full shrink-0 z-30 sticky top-0">
      <AnimatePresence>
        {/* Offline Warning Bar (Native App Style like Facebook/Daraz) */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-amber-500 text-slate-950 px-3 py-1.5 shadow-md flex items-center justify-between border-b border-amber-600/30 text-[10px]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 bg-amber-600 text-white rounded-md shrink-0 flex items-center justify-center">
                <WifiOff className="w-3 h-3 animate-pulse" />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-black text-[10.5px] truncate">
                  অফলাইন মোড চালু আছে (Offline)
                </span>
                <span className="text-[8.5px] text-amber-950 font-semibold truncate flex items-center gap-1">
                  <Database className="w-2.5 h-2.5 inline" />
                  ক্যাশড {cachedCount}+ প্রোডাক্ট ও সার্ভিস অফলাইনে সক্রিয়
                </span>
              </div>
            </div>

            <button
              onClick={onRetry}
              disabled={isChecking}
              className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 shrink-0 ml-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isChecking ? 'চেক হচ্ছে...' : 'রিট্রাই (Retry)'}</span>
            </button>
          </motion.div>
        )}

        {/* Back Online Green Reconnect Alert */}
        {isOnline && wasOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-emerald-600 text-white px-3 py-1.5 shadow-md flex items-center justify-between text-[10px]"
          >
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-emerald-700 text-emerald-200 rounded-md shrink-0">
                <Wifi className="w-3 h-3" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-[10.5px]">সংযোগ পুনরুদ্ধার হয়েছে (Back Online)</span>
                <span className="text-[8.5px] text-emerald-100 font-medium">লাইভ ডেটা ও সার্ভার সিঙ্ক সম্পন্ন হয়েছে</span>
              </div>
            </div>
            <span className="text-[8px] bg-emerald-800 text-emerald-100 font-bold px-2 py-0.5 rounded-full">
              সক্রিয় [✓]
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const OfflineFallbackCard: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({
  title = 'অফলাইন ডেটা প্রদর্শিত হচ্ছে',
  description = 'ইন্টারনেট সংযোগ না থাকায় সর্বশেষ সংরক্ষিত লোকাল ডেটা দেখাচ্ছে। নেট ফিরে এলে স্বয়ংক্রিয়ভাবে আপডেট হবে।',
  onRetry,
}) => {
  return (
    <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs my-2">
      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5 text-left">
        <h4 className="text-[11px] font-black text-amber-950">{title}</h4>
        <p className="text-[9px] text-amber-900 leading-relaxed">{description}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 text-[8.5px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            পুনরায় সংযোগ পরীক্ষা করুন
          </button>
        )}
      </div>
    </div>
  );
};
