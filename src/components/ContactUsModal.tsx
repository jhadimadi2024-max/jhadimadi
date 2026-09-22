import React, { useEffect } from 'react';
import {
  X,
  MessageSquare,
  MessageCircle,
  Phone,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../types';

export interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language | 'bn' | 'en';
  onOpenAiFallback?: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({
  isOpen,
  onClose,
  lang = 'bn',
  onOpenAiFallback,
}) => {
  const isEn = lang === 'en';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

      // If Tidio is hydrating in the background, wait for ready event
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

      // Fallback if blocked or taking long
      setTimeout(() => {
        if (!isOpened && !(window as any).tidioChatApi) {
          if (onOpenAiFallback) {
            onOpenAiFallback();
          }
        }
      }, 2200);
    } catch (_) {
      if (onOpenAiFallback) onOpenAiFallback();
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

  const handleOpenMessenger = () => {
    // Official Facebook Messenger direct link
    window.open('https://m.me/110948632094208', '_blank', 'noopener,noreferrer');
  };

  const handleDirectCall = () => {
    window.location.href = 'tel:+8801870592699';
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(
      isEn ? 'Support Inquiry - Jhadimadi.com' : 'গ্রাহক সেবা ও সহায়তা - ঝাদিমাদি ডটকম'
    );
    window.location.href = `mailto:support@jhadimadi.com?subject=${subject}`;
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-us-modal-title"
      id="contact-us-modal-container"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-scaleUp">
        {/* Header Bar (Brand Green) */}
        <div className="bg-gradient-to-r from-[#065f46] via-[#0A6A32] to-[#10b981] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0 border border-emerald-300">
              <Headphones className="w-5 h-5 text-[#065f46]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="contact-us-modal-title"
                  className="font-black text-base sm:text-lg tracking-tight text-white leading-none truncate"
                >
                  {isEn ? 'Contact Us' : 'যোগাযোগ করুন'}
                </h2>
                <span className="text-[9.5px] bg-amber-400 text-stone-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  24/7 Support
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium truncate mt-1">
                {isEn
                  ? 'Always by your side like a friend • Instant Assistance'
                  : 'বন্ধুর মতো সবসময় আপনার পাশে • ঝাদিমাদি সাপোর্ট'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 ml-1"
            aria-label={isEn ? 'Close' : 'বন্ধ করুন'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-[#faf9f6]">
          {/* 1. Zadi Message / Tidio Live Chat */}
          <div
            onClick={handleOpenTidio}
            className="w-full p-4 rounded-2xl bg-white hover:bg-emerald-50/70 border-2 border-emerald-600/30 hover:border-[#065f46] shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-start justify-between gap-3"
            role="button"
            tabIndex={0}
            id="btn-contact-tidio-live-chat"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[#065f46] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative">
                <MessageSquare className="w-5 h-5 text-[#065f46]" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm sm:text-base text-stone-900 group-hover:text-[#065f46] transition-colors">
                    {isEn ? 'Zadi Message / Tidio Live Chat' : 'জাদী মেসেজ / টিডিও লাইভ চ্যাট'}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-[#065f46] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#065f46]" />
                    {isEn ? 'Online Now' : 'লাইভ এক্টিভ'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  {isEn
                    ? 'Chat live directly with our support team with instant response'
                    : 'আমাদের বিশেষজ্ঞ সাপোর্ট টিমের সাথে সরাসরি লাইভ চ্যাট করুন'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#065f46] group-hover:underline">
                  <span>{isEn ? 'Open Live Chat' : 'লাইভ চ্যাট শুরু করুন'}</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-[#065f46] shrink-0 mt-1" />
          </div>

          {/* 2. WhatsApp Chat & Direct Call Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 2A: WhatsApp Chat */}
            <div
              onClick={handleOpenWhatsApp}
              className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-stone-200/90 hover:border-emerald-600 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              role="button"
              tabIndex={0}
              id="btn-contact-whatsapp"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#16a34a] shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5 text-[#16a34a]" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-stone-900 group-hover:text-emerald-700 block truncate">
                    {isEn ? 'WhatsApp Chat' : 'হোয়াটসঅ্যাপ চ্যাট'}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">
                    +880 1870-592699
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                {isEn ? 'Fast WhatsApp messaging for orders & assistance' : 'অর্ডার ও সেবার জন্য দ্রুত হোয়াটসঅ্যাপ মেসেজ পাঠান'}
              </p>
              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#16a34a]">
                <span>{isEn ? 'Chat on WhatsApp' : 'মেসেজ পাঠান'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 2B: Direct Call */}
            <div
              onClick={handleDirectCall}
              className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-stone-200/90 hover:border-emerald-600 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              role="button"
              tabIndex={0}
              id="btn-contact-direct-call"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#065f46] shrink-0 group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-4.5 h-4.5 text-[#065f46]" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-stone-900 group-hover:text-[#065f46] block truncate">
                    {isEn ? 'Direct Call' : 'সরাসরি কল'}
                  </span>
                  <span className="text-[11px] font-bold text-[#065f46]">
                    01870592699
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                {isEn ? 'Direct phone call to our official helpline' : 'অফিসিয়াল হটলাইনে সরাসরি ফোন করে কথা বলুন'}
              </p>
              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#065f46]">
                <span>{isEn ? 'Call Now' : 'এখনই কল করুন'}</span>
                <Phone className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* 3. Facebook Messenger (Seamless direct link to official page) */}
          <div
            onClick={handleOpenMessenger}
            className="w-full p-4 rounded-2xl bg-white hover:bg-blue-50/60 border border-stone-200/90 hover:border-blue-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3"
            role="button"
            tabIndex={0}
            id="btn-contact-facebook-messenger"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-[#0084FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5 text-[#0084FF]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-stone-900 group-hover:text-blue-600 transition-colors truncate">
                    {isEn ? 'Facebook Messenger' : 'ফেসবুক মেসেঞ্জার'}
                  </span>
                  <span className="text-[9.5px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Official Page
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5 truncate">
                  {isEn
                    ? 'Direct link to message official Jhadimadi page (m.me/110948632094208)'
                    : 'অফিসিয়াল ঝাদিমাদি ফেসবুক পেজে সরাসরি মেসেজ পাঠান'}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-blue-600 shrink-0" />
          </div>

          {/* 4. Email and General Support Details */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#065f46]" />
                {isEn ? 'Email & General Support' : 'ইমেইল ও সাধারণ সহায়তা'}
              </span>
              <span className="text-[10px] text-stone-400 font-semibold">
                Official Channels
              </span>
            </div>

            {/* Email Action */}
            <div
              onClick={handleSendEmail}
              className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200/80 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-[#065f46] shrink-0">
                  <Mail className="w-4 h-4 text-[#065f46]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-stone-900 group-hover:text-[#065f46] block truncate">
                    support@jhadimadi.com
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {isEn ? 'Official customer & partner support email' : 'অফিসিয়াল ইমেইল সহায়তা'}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#065f46] shrink-0" />
            </div>

            {/* General Support Details & Service Area */}
            <div className="space-y-1.5 text-xs text-stone-600 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-[11.5px] leading-relaxed">
                  {isEn
                    ? 'Chittagong Hill Tracts (Khagrachari, Rangamati, Bandarban) & All Bangladesh'
                    : 'খাগড়াছড়ি, রাঙ্গামাটি, বান্দরবান পার্বত্য জেলা এবং সমগ্র বাংলাদেশ'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11.5px] leading-relaxed">
                  {isEn
                    ? 'Support Hours: 24/7 Digital Booking & Daily 8:00 AM – 10:00 PM Helpline'
                    : 'সেবা সময়: ২৪/৭ ডিজিটাল বুকিং ও সকাল ৮:০০ – রাত ১০:০০ হেল্পলাইন'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[#065f46]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Jhadimadi.com Support</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            {isEn ? 'Close' : 'বন্ধ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactUsModal;
