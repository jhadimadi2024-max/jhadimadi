import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  LogIn,
  UserPlus,
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Phone,
  PhoneCall,
  LayoutDashboard,
  Lock,
  ExternalLink,
  Headphones,
  MessageSquare,
  MessageCircle,
  Mail,
  Sparkles,
} from 'lucide-react';
import { PolicySection } from './PolicyCenterModal';
import { Language } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenProfile: () => void;
  onOpenPolicyCenter?: (section?: PolicySection) => void;
  onOpenCompanyInfo?: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
  onOpenAccountDeletion?: () => void;
  onOpenContactUs?: () => void;
  onOpenAiChat?: () => void;
  lang?: Language | 'bn' | 'en';
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenPolicyCenter,
  onOpenCompanyInfo,
  onOpenAdmin,
  onLogout,
  onOpenContactUs,
  onOpenAiChat,
  lang = 'bn',
}) => {
  const isEn = lang === 'en';
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);

  const handleOpenTidio = () => {
    onClose();
    try {
      document.body.classList.add('tidio-chat-visible');
      const tidioApi = (window as any).tidioChatApi;
      if (tidioApi) {
        if (typeof tidioApi.show === 'function') tidioApi.show();
        if (typeof tidioApi.open === 'function') tidioApi.open();
        return;
      }

      let isOpened = false;
      const onReady = () => {
        isOpened = true;
        try {
          const api = (window as any).tidioChatApi;
          if (api) {
            if (typeof api.show === 'function') api.show();
            if (typeof api.open === 'function') api.open();
          }
        } catch (_) {}
      };
      document.addEventListener('tidioChat-ready', onReady, { once: true });

      setTimeout(() => {
        if (!isOpened && !(window as any).tidioChatApi && onOpenAiChat) {
          onOpenAiChat();
        }
      }, 2000);
    } catch (_) {
      if (onOpenAiChat) onOpenAiChat();
    }
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      isEn
        ? 'Hello! I am contacting Jhadimadi.com for support and inquiries.'
        : 'নমস্কার / আসসালামু আলাইকুম! আমি ঝাদিমাদি ডটকমের সেবা ও সহায়তার জন্য যোগাযোগ করছি।'
    );
    window.open(`https://wa.me/8801870592699?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleDirectCall = () => {
    window.location.href = 'tel:+8801870592699';
  };

  const handleOpenMessenger = () => {
    window.open('https://m.me/110948632094208', '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(
      isEn ? 'Support Inquiry - Jhadimadi.com' : 'গ্রাহক সেবা ও সহায়তা - ঝাদিমাদি ডটকম'
    );
    window.location.href = `mailto:support@jhadimadi.com?subject=${subject}`;
  };

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Jhadimadi Navigation Menu"
      id="jhadimadi-navigation-drawer-backdrop"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Sliding in from Left) */}
      <div 
        id="jhadimadi-navigation-drawer"
        className="relative w-[86vw] max-w-[340px] sm:max-w-[380px] h-full bg-white shadow-2xl flex flex-col z-10 overflow-hidden border-r border-stone-200 animate-slideRight"
      >
        {/* Drawer Header (Exact Brand Green #065f46) */}
        <div className="bg-gradient-to-r from-[#065f46] via-[#0A6A32] to-[#10b981] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center shrink-0 border border-emerald-300">
              <img 
                src="https://i.ibb.co.com/sppWZhc9/logo33.png" 
                alt="Jhadimadi Runner" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/runner-logo.png";
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-white font-sans drop-shadow-xs truncate">
                  JHADIMADI.COM
                </span>
                <span className="text-[9px] bg-amber-400 text-stone-900 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  Official
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium truncate mt-0.5">
                Always by your side like a friend
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-navigation-drawer"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 ml-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body — Exact English Items in Strict Top-to-Bottom Order */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col justify-between space-y-3 bg-[#faf9f6]">
          
          <div className="space-y-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-2 block">
              Menu
            </span>

            {/* 1. Jhadimadi (With appropriate logo/icon, showing company details/footer info) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenCompanyInfo) {
                  onOpenCompanyInfo();
                }
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-emerald-50/70 border border-stone-200/90 hover:border-[#065f46] shadow-2xs transition-all text-left cursor-pointer group"
              id="drawer-item-1-jhadimadi"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#065f46]/30 flex items-center justify-center p-1 group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                  <img
                    src="https://i.ibb.co.com/sppWZhc9/logo33.png"
                    alt="Jhadimadi"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/runner-logo.png";
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-stone-900 group-hover:text-[#065f46] transition-colors">
                      Jhadimadi
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-[#065f46] font-bold px-1.5 py-0.5 rounded-md">
                      Company Info
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    Company details, mission & platform footer info
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 2. Policy (With an icon, detailing security and privacy policies) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenPolicyCenter) {
                  onOpenPolicyCenter('overview');
                }
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-emerald-50/70 border border-stone-200/90 hover:border-[#065f46] shadow-2xs transition-all text-left cursor-pointer group"
              id="drawer-item-2-policy"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#065f46] group-hover:scale-105 transition-transform shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#065f46]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-stone-900 group-hover:text-[#065f46] transition-colors">
                      Policy
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-md">
                      Security & Privacy
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    Security, privacy, return & customer policies
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 3. Contact Us (Header Three-Dot Menu Consolidated Contact Options Dropdown) */}
            <div className="rounded-2xl bg-white border border-stone-200/90 shadow-2xs overflow-hidden transition-all" id="drawer-item-contact-us-container">
              <button
                type="button"
                onClick={() => setIsContactDropdownOpen(!isContactDropdownOpen)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-emerald-50/70 transition-all text-left cursor-pointer group"
                id="drawer-item-contact-us"
                aria-expanded={isContactDropdownOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#065f46] group-hover:scale-105 transition-transform shrink-0">
                    <Headphones className="w-5 h-5 text-[#065f46]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-stone-900 group-hover:text-[#065f46] transition-colors">
                        {isEn ? 'Contact Us' : 'Contact Us / যোগাযোগ'}
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-[#065f46] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Live Help
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {isEn ? 'Live chat, WhatsApp, Messenger & Helpline' : 'লাইভ চ্যাট, হোয়াটসঅ্যাপ, মেসেঞ্জার ও কল'}
                    </p>
                  </div>
                </div>
                {isContactDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#065f46] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-[#065f46] shrink-0" />
                )}
              </button>

              {/* Consolidated Contact Channels Dropdown */}
              {isContactDropdownOpen && (
                <div className="p-3 bg-stone-50/80 border-t border-stone-200/80 space-y-2.5 animate-fadeIn">
                  
                  {/* Option 1: Zadi Message / Tidio Live Chat */}
                  <div
                    onClick={handleOpenTidio}
                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-600/30 hover:border-emerald-600 shadow-2xs cursor-pointer transition-all flex items-center justify-between group"
                    role="button"
                    tabIndex={0}
                    id="drawer-contact-tidio"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-300 text-[#065f46] flex items-center justify-center shrink-0 relative">
                        <MessageSquare className="w-4 h-4 text-[#065f46]" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-stone-900 group-hover:text-[#065f46]">
                            Zadi Message / Tidio Live Chat
                          </span>
                          <span className="text-[8px] bg-emerald-600 text-white font-bold px-1 rounded-sm">
                            LIVE
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 truncate">
                          {isEn ? 'Chat live with support team' : 'সাপোর্ট টিমের সাথে লাইভ চ্যাট'}
                        </p>
                      </div>
                    </div>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>

                  {/* Option 2: WhatsApp Chat & Direct Call Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp */}
                    <div
                      onClick={handleOpenWhatsApp}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-500 shadow-2xs cursor-pointer transition-all flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      id="drawer-contact-whatsapp"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#16a34a] flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-[#16a34a]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-stone-900 group-hover:text-[#16a34a] block truncate leading-tight">
                          WhatsApp
                        </span>
                        <span className="text-[9.5px] text-stone-500 block truncate">
                          ০১৮৭০৫৯২৬৯৯
                        </span>
                      </div>
                    </div>

                    {/* Direct Call */}
                    <div
                      onClick={handleDirectCall}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-500 shadow-2xs cursor-pointer transition-all flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      id="drawer-contact-call"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#065f46] flex items-center justify-center shrink-0">
                        <PhoneCall className="w-4 h-4 text-[#065f46]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-stone-900 group-hover:text-[#065f46] block truncate leading-tight">
                          {isEn ? 'Direct Call' : 'সরাসরি কল'}
                        </span>
                        <span className="text-[9.5px] text-stone-500 block truncate">
                          01870592699
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Option 3: Facebook Messenger (Direct link m.me/110948632094208) */}
                  <div
                    onClick={handleOpenMessenger}
                    className="p-2.5 rounded-xl bg-white hover:bg-blue-50/80 border border-stone-200 hover:border-blue-500 shadow-2xs cursor-pointer transition-all flex items-center justify-between group"
                    role="button"
                    tabIndex={0}
                    id="drawer-contact-messenger"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-[#0084FF] flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-[#0084FF]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900 group-hover:text-blue-600">
                            Facebook Messenger
                          </span>
                          <span className="text-[8.5px] bg-blue-100 text-blue-800 font-semibold px-1 rounded-sm">
                            Official
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 truncate">
                          m.me/110948632094208 (Jhadimadi Official Page)
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-blue-600 shrink-0" />
                  </div>

                  {/* Option 4: Email and General Support Details */}
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                    <div
                      onClick={handleSendEmail}
                      className="flex items-center justify-between cursor-pointer group"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-[#065f46] shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-stone-800 group-hover:text-[#065f46] block truncate">
                            support@jhadimadi.com
                          </span>
                          <span className="text-[9.5px] text-stone-500 block truncate">
                            {isEn ? 'Email Support • 24/7 Response' : 'ইমেইল সহায়তা • দ্রুত উত্তর'}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-[#065f46] shrink-0" />
                    </div>

                    <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[9.5px] text-stone-500">
                      <span>📍 Khagrachari, CHT & Bangladesh</span>
                      {onOpenContactUs && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onOpenContactUs();
                          }}
                          className="font-bold text-[#065f46] hover:underline cursor-pointer"
                        >
                          {isEn ? 'Full Details ➔' : 'বিস্তারিত ➔'}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* 4. Sign In / Sign Up (Authentication options) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (currentUser) {
                  onOpenProfile();
                } else {
                  onOpenAuth('signin');
                }
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-emerald-50/70 border border-stone-200/90 hover:border-[#065f46] shadow-2xs transition-all text-left cursor-pointer group"
              id="drawer-item-3-auth"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#065f46] group-hover:scale-105 transition-transform shrink-0">
                  {currentUser ? (
                    <img 
                      src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} 
                      alt={currentUser.name || 'User'} 
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-[#065f46]"
                    />
                  ) : (
                    <UserPlus className="w-5 h-5 text-[#065f46]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-stone-900 group-hover:text-[#065f46] transition-colors truncate">
                      {currentUser ? (currentUser.name || 'My Profile') : 'Sign In / Sign Up'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                      currentUser ? 'bg-emerald-100 text-[#065f46]' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {currentUser ? 'Active' : 'Authentication'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    {currentUser 
                      ? (currentUser.phone || 'View Profile & Account Details')
                      : 'Authentication options to access your account'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#065f46] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>

          {/* Bottom Section: Dashboard (faint/low-opacity for admin) & Logout (absolute bottom) */}
          <div className="mt-auto pt-4 space-y-2.5">
            {/* 4. Dashboard: Opens Admin Dashboard in a completely separate browser tab */}
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-dashed border-stone-300/80 bg-stone-50/40 hover:bg-stone-100 opacity-60 hover:opacity-100 transition-all text-left cursor-pointer group no-underline"
              id="drawer-item-4-dashboard"
              title={lang === 'bn' ? 'ঝাদিমাদি অ্যাডমিন ড্যাশবোর্ড (নতুন আলাদা ট্যাবে খুলুন)' : 'Jhadimadi Admin Dashboard (Open in new browser tab)'}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-stone-200/70 border border-stone-300 flex items-center justify-center text-stone-600 group-hover:text-[#065f46] shrink-0">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-600 group-hover:text-stone-900 transition-colors">
                      {lang === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
                    </span>
                    <span className="text-[8px] bg-stone-200/80 text-stone-600 font-semibold px-1 py-0.2 rounded">
                      Admin
                    </span>
                  </div>
                  <p className="text-[9.5px] text-stone-400 truncate">
                    {lang === 'bn' ? 'মালিক ও অ্যাডমিন প্রবেশ (নতুন ট্যাব)' : 'Authorized admin entry (New Tab)'}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#065f46] transition-colors shrink-0" />
            </a>

            {/* 5. Logout: Placed separately as the absolute last item at the very bottom of the menu */}
            <div className="pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border shadow-2xs transition-all text-left cursor-pointer group ${
                  currentUser 
                    ? 'bg-rose-50/80 hover:bg-rose-100 border-rose-200 text-rose-950 active:scale-[0.99]' 
                    : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-700 active:scale-[0.99]'
                }`}
                id="drawer-item-5-logout"
                title="Sign out of current session"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    currentUser 
                      ? 'bg-rose-100 border-rose-300 text-rose-700 group-hover:scale-105 transition-transform' 
                      : 'bg-stone-100 border-stone-300 text-stone-500'
                  }`}>
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm">
                        Logout
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        currentUser ? 'bg-rose-200 text-rose-900' : 'bg-stone-200 text-stone-600'
                      }`}>
                        Session
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {currentUser ? 'End active profile session' : 'Sign out or reset session'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>
          </div>

        </div>

        {/* Drawer Footer with Official Hotline & Copyright */}
        <div className="p-3 bg-stone-100/90 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 shrink-0">
          <a 
            href="https://wa.me/8801870592699"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#065f46] font-bold hover:underline"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>01870592699</span>
          </a>
          <span className="text-[10px]">
            &copy; {new Date().getFullYear()} Jhadimadi.com
          </span>
        </div>
      </div>
    </div>
  );
};

export default NavigationDrawer;
