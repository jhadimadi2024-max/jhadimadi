import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
  componentName?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Enterprise Global & Component-level Error Boundary
 * Catches render crashes and displays a graceful fallback screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.handleReset = this.handleReset.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error(`[ErrorBoundary] Caught error in ${this.props.componentName || 'App'}:`, error, errorInfo);
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('splash-active');
        if (document.body) document.body.classList.remove('splash-active');
        const rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.classList.remove('splash-active');
          rootEl.style.removeProperty('background-color');
        }
        const splashScreenRoot = document.getElementById('splash-screen-root');
        if (splashScreenRoot) splashScreenRoot.style.display = 'none';
        const preHydrate = document.getElementById('pre-hydration-splash');
        if (preHydrate) preHydrate.style.display = 'none';
      }
    } catch (_) {}
  }

  private handleReset(): void {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  }

  private handleGoHome(): void {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  }

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isWidget = Boolean(this.props.componentName && this.props.componentName !== 'RootApplication');

      if (isWidget) {
        return (
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-center space-y-2 my-2">
            <div className="flex items-center justify-center gap-1.5 text-amber-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>এই অংশটি লোড হতে সাময়িক সমস্যা হয়েছে</span>
            </div>
            <p className="text-[11px] text-amber-700">
              {this.state.error?.message || 'অনুগ্রহ করে পুনরায় চেষ্টা করুন।'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 transition shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>রিলোড করুন</span>
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#fdfbfb] text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
            
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50/60 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                কিছু একটা সমস্যা হয়েছে
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                অ্যাপ্লিকেশনের এই অংশটি লোড করার সময় অপ্রত্যাশিত ত্রুটি ঘটেছে। আপনার ডেটা সুরক্ষিত রয়েছে।
              </p>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="p-3 bg-slate-900 text-rose-300 rounded-xl text-left text-[10px] font-mono overflow-auto max-h-32 select-all border border-slate-800">
                <p className="font-bold text-rose-400 mb-1">{this.state.error.toString()}</p>
                <p className="text-slate-400 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পুনরায় লোড করুন</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition"
              >
                <Home className="w-4 h-4" />
                <span>হোমে যান</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-400 font-medium">
              jhadimadi.com • Error Boundary Shield
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
