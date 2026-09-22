import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { NetworkErrorDetail, notifyNetworkRestored } from '../utils/networkRetry';

export const NetworkStatusNotifier: React.FC = () => {
  const { isOnline, wasOffline, isChecking, checkConnection } = useNetworkStatus();
  const [activeNetworkError, setActiveNetworkError] = useState<NetworkErrorDetail | null>(null);
  const [isRetryingError, setIsRetryingError] = useState<boolean>(false);

  // Listen for global custom network error events
  useEffect(() => {
    const handleNetworkError = (event: Event) => {
      const customEvent = event as CustomEvent<NetworkErrorDetail>;
      if (customEvent && customEvent.detail) {
        setActiveNetworkError(customEvent.detail);
      }
    };

    const handleNetworkRestored = () => {
      setActiveNetworkError(null);
    };

    window.addEventListener('app:network-error', handleNetworkError);
    window.addEventListener('app:network-restored', handleNetworkRestored);

    return () => {
      window.removeEventListener('app:network-error', handleNetworkError);
      window.removeEventListener('app:network-restored', handleNetworkRestored);
    };
  }, []);

  // Auto-dismiss active transient network error toast after 6.5 seconds
  useEffect(() => {
    if (!activeNetworkError) return;
    const timer = setTimeout(() => {
      setActiveNetworkError(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [activeNetworkError]);

  // Clear network error when online status is restored
  useEffect(() => {
    if (isOnline && activeNetworkError?.isOffline) {
      setActiveNetworkError(null);
    }
  }, [isOnline, activeNetworkError]);

  const handleManualRetry = useCallback(async () => {
    setIsRetryingError(true);
    try {
      const online = await checkConnection();
      if (online) {
        notifyNetworkRestored();
        if (activeNetworkError?.retryFn) {
          try {
            await activeNetworkError.retryFn();
          } catch (_) {}
        }
        setActiveNetworkError(null);
      }
    } finally {
      setIsRetryingError(false);
    }
  }, [checkConnection, activeNetworkError]);

  return (
    <div
      id="global-network-notifier-container"
      className="fixed top-0 left-0 right-0 pointer-events-none flex flex-col items-center gap-2 z-[999999] px-2 sm:px-4 pt-1.5"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {/* 1. Subtle Global Offline Banner (When navigator.onLine is false or connection lost) */}
        {!isOnline && (
          <motion.div
            key="offline-banner"
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="pointer-events-auto w-full max-w-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-2xl shadow-xl border border-amber-400/40 p-2.5 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/40 border border-amber-300/50 flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-bold text-[12px] sm:text-[13px] tracking-tight truncate">
                  You are currently offline. Please check your internet connection.
                </span>
                <span className="text-[10px] sm:text-[11px] text-amber-100 font-medium truncate">
                  আপনি অফলাইনে আছেন। ক্যাশড ডাটা প্রদর্শিত হচ্ছে।
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualRetry}
              disabled={isChecking || isRetryingError}
              className="shrink-0 bg-white/20 hover:bg-white/30 active:scale-95 disabled:opacity-50 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl border border-white/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw
                className={`w-3 h-3 ${isChecking || isRetryingError ? 'animate-spin' : ''}`}
              />
              <span>{isChecking || isRetryingError ? 'চেক হচ্ছে...' : 'Retry'}</span>
            </button>
          </motion.div>
        )}

        {/* 2. Reconnected / Back Online Subtle Toast */}
        {isOnline && wasOffline && (
          <motion.div
            key="online-restored-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="pointer-events-auto w-full max-w-md bg-emerald-600 text-white rounded-2xl shadow-xl border border-emerald-400/40 p-2.5 px-4 flex items-center justify-between gap-2.5 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-bold text-[12px] truncate">
                  You are back online. Connected to live server.
                </span>
                <span className="text-[10px] text-emerald-100 truncate">
                  ইন্টারনেট সংযোগ ফিরে এসেছে। লাইভ ডেটা সক্রিয়।
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-emerald-800/80 px-2 py-0.5 rounded-full text-emerald-100 shrink-0">
              Connected
            </span>
          </motion.div>
        )}

        {/* 3. Transient Network Error Alert Toast (Triggered on API / Fetch / RPC Failure) */}
        {activeNetworkError && isOnline && (
          <motion.div
            key="network-error-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="pointer-events-auto w-full max-w-lg bg-rose-700 text-white rounded-2xl shadow-2xl border border-rose-400/40 p-3 sm:px-4 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-600/60 border border-rose-400/40 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-bold text-[12px] sm:text-[12.5px] truncate">
                  Network error. Please reconnect to the internet and try again.
                </span>
                <span className="text-[10.5px] text-rose-100 font-medium truncate">
                  ইন্টারনেট সংযোগ সমস্যা। অনুগ্রহ করে সংযোগ নিশ্চিত করে আবার চেষ্টা করুন।
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isChecking || isRetryingError}
                className="bg-white text-rose-800 hover:bg-rose-50 active:scale-95 disabled:opacity-60 font-black text-[10.5px] px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isChecking || isRetryingError ? 'animate-spin' : ''}`}
                />
                <span>{isChecking || isRetryingError ? '...' : 'Retry'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNetworkError(null)}
                className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkStatusNotifier;
