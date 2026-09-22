import React from 'react';
import { translations, Language } from '../utils/translations';
import { MapPin, Mail, MessageCircle, ShieldCheck, ExternalLink } from 'lucide-react';

interface FooterProps {
  lang?: Language;
  onCategoriesClick?: () => void;
  onSearchClick?: () => void;
  onPostClick?: () => void;
  onAdminClick?: () => void;
  onPrivacyPolicyClick?: () => void;
  className?: string;
}

/**
 * Jhadimadi.com Compact Official Footer
 * Restrictedly rendered strictly on the Customer Home Page.
 */
export const Footer: React.FC<FooterProps> = ({ 
  lang = 'bn',
  onAdminClick,
  onPrivacyPolicyClick,
  className = '',
}) => {
  const runnerImgSrc = "https://i.ibb.co.com/sppWZhc9/logo33.png";

  const handleAdminLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    // Guarantee opening in a completely separate new browser tab (_blank)
    try {
      const adminUrl = window.location.origin + '/admin';
      const newTab = window.open(adminUrl, '_blank', 'noopener,noreferrer');
      if (newTab) {
        e.preventDefault();
        return;
      }
    } catch (_) {
      // Native anchor with target="_blank" will handle it
    }
  };

  return (
    <footer 
      id="customer-app-footer"
      className={`mt-auto bg-[#faf9f6] text-slate-700 pt-2.5 pb-3 sm:pb-3 px-3 border-t border-stone-200 transition-all select-none ${className}`}
    >
      <div className="max-w-md mx-auto text-center space-y-2">
        
        {/* ১. হেডার / ব্র্যান্ডিং: লোগো + টেক্সট পাশাপাশি + ট্যাগলাইন */}
        <div className="flex items-center justify-center gap-2">
          {/* Logo icon */}
          <div className="w-7 h-7 rounded-lg bg-[#faf9f6] p-0.5 shadow-2xs border border-emerald-200/80 flex items-center justify-center shrink-0">
            <img
              src={runnerImgSrc}
              alt="Jhadimadi Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to local image if external fails
                (e.currentTarget as HTMLImageElement).src = "/runner-logo.png";
              }}
            />
          </div>

          {/* Brand Name & Tagline */}
          <div className="text-left leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-emerald-950 font-sans tracking-tight">
                Jhadimadi.com
              </span>
              <span className="text-gray-400 text-[10px] font-semibold">/</span>
              <span className="text-[11px] font-bold text-red-600 font-sans">
                ঝাদিমাদি ডটকম
              </span>
            </div>
            <p className="text-[9px] text-emerald-850 font-medium text-emerald-800/90 tracking-normal mt-0.5">
              "বন্ধুর মতো সবসময় আপনার পাশে"
            </p>
          </div>
        </div>

        {/* ২. কমপ্যাক্ট কন্টাক্ট ইনফো রো (Compact Row with Icons) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-[10px] text-slate-600 pt-0.5">
          {/* 📱 WhatsApp */}
          <a 
            href="https://wa.me/8801870592699" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 rounded-full border border-emerald-200/60 font-semibold transition-colors cursor-pointer"
            title="WhatsApp এ মেসেজ পাঠান"
          >
            <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>📱 হোয়াটসঅ্যাপ: ০১৮৭০৫৯২৬৯৯</span>
          </a>

          {/* ✉️ Email */}
          <a 
            href="mailto:Jhadimadi2024@gmail.com" 
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full border border-slate-200 font-semibold transition-colors cursor-pointer"
            title="ইমেইল করুন"
          >
            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
            <span>✉️ Jhadimadi2024@gmail.com</span>
          </a>

          {/* 📍 Location */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-semibold">
            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
            <span>📍 খাগড়াছড়ি পার্বত্য জেলা</span>
          </div>
        </div>

        {/* ৩. কপিরাইট নোটিশ ও সূক্ষ্ম ব্লার্ড/স্বচ্ছ অ্যাডমিন কন্ট্রোল প্যানেল শর্টকাট (Subtle Blurred/Transparent Admin Access) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-[10px] text-slate-400 font-medium select-none flex-wrap">
          <div className="flex items-center gap-1.5">
            <span>© 2026 Jhadimadi.com. All rights reserved.</span>
          </div>

          {onPrivacyPolicyClick && (
            <>
              <span className="hidden sm:inline text-slate-300">•</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrivacyPolicyClick();
                }}
                id="btn-footer-privacy-policy"
                className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9px] text-slate-500 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
                title={lang === 'bn' ? 'গোপনীয়তা নীতি ও ডেটা সুরক্ষা' : 'Privacy Policy & Data Security'}
              >
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                <span>{lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</span>
              </button>
            </>
          )}

          <span className="hidden sm:inline text-slate-300">•</span>

          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
            id="btn-footer-admin-discreet"
            className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-400/70 hover:text-slate-500 opacity-60 hover:opacity-90 transition-all duration-200 cursor-pointer no-underline"
            title="ঝাদিমাদি অ্যাডমিন ড্যাশবোর্ড (নতুন আলাদা ট্যাবে খুলুন)"
            aria-label="অ্যাডমিন ড্যাশবোর্ড"
          >
            <ShieldCheck className="w-2.5 h-2.5 text-slate-400/80 group-hover:text-emerald-700/70 transition-colors" />
            <span className="text-[8.5px] sm:text-[9px] font-normal tracking-tight text-slate-400/90 group-hover:text-slate-600 transition-colors">
              {lang === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
            </span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-300/70 group-hover:text-slate-500 transition-colors" />
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
