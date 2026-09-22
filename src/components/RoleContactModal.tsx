import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Droplet, 
  MapPin, 
  CheckCircle2, 
  Send, 
  ExternalLink,
  PhoneCall,
  AlertCircle,
  Lock
} from 'lucide-react';
import { Language } from '../utils/translations';

export interface RoleContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  memberUID: string;
  roleName: string;
  role: 'product_seller' | 'service_provider' | 'permanent_member' | string;
  bloodGroup?: string;
  realPhone: string;
  avatar?: string;
  location?: string;
  lang?: Language;
  extraDetails?: string;
}

export const maskPhoneNumber = (phone?: string): string => {
  if (!phone) return '০১৮******০০';
  const clean = phone.replace(/[^0-9+]/g, '');
  if (clean.length < 7) return '০১৭******৮৯';
  const start = clean.slice(0, 3);
  const end = clean.slice(-2);
  return `${start}******${end}`;
};

export const RoleContactModal: React.FC<RoleContactModalProps> = ({
  isOpen,
  onClose,
  name,
  memberUID,
  roleName,
  role,
  bloodGroup = 'B+',
  realPhone,
  avatar,
  location,
  lang = 'bn',
  extraDetails
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const isBn = lang === 'bn';

  if (!isOpen) return null;

  // Clean phone digits for tel: and wa.me
  const cleanDigits = (realPhone || '01800000000').replace(/[^0-9]/g, '');
  const waPhone = cleanDigits.startsWith('88') ? cleanDigits : `88${cleanDigits.startsWith('0') ? cleanDigits.slice(1) : cleanDigits}`;
  const maskedPhone = maskPhoneNumber(realPhone);

  const defaultGreeting = isBn
    ? `আসসালামু আলাইকুম ${name} ভাই/ম্যাডাম, আমি ঝাদিমাদি প্ল্যাটফর্ম (ID: ${memberUID}) থেকে আপনার সাথে যোগাযোগ করতে চাই।`
    : `Hello ${name}, I am contacting you via Jhadimadi platform (UID: ${memberUID}).`;

  const handleCall = () => {
    if (realPhone) {
      window.location.href = `tel:${realPhone}`;
    }
  };

  const handleWhatsApp = () => {
    const textToSend = encodeURIComponent(customMessage.trim() || defaultGreeting);
    window.open(`https://wa.me/${waPhone}?text=${textToSend}`, '_blank');
  };

  const handleSendSMS = () => {
    const textToSend = encodeURIComponent(customMessage.trim() || defaultGreeting);
    window.location.href = `sms:${realPhone}?body=${textToSend}`;
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      id="role-contact-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="role-contact-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0E8246] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {isBn ? 'সরাসরি যোগাযোগ ও বুকিং' : 'Direct Contact & Booking'}
              </h3>
              <p className="text-[10px] text-emerald-100 font-medium">
                {isBn ? 'ঝাদিমাদি সুরক্ষিত কমিউনিকেশন' : 'Jhadimadi Secure Contact'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            id="role-contact-modal-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* User Profile Summary Card */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3">
            <div className="relative shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-600 bg-emerald-50"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-emerald-100 text-[#0E8246] font-bold flex items-center justify-center text-lg border-2 border-emerald-600">
                  {name ? name.charAt(0).toUpperCase() : 'J'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-[#0E8246] text-white p-0.5 rounded-full shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="text-sm font-black text-gray-950 truncate leading-tight">
                {name}
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#0E8246]">
                  {roleName}
                </span>
                {bloodGroup && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                    <Droplet className="w-2.5 h-2.5 text-red-600 fill-red-600" />
                    <span>{bloodGroup}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-gray-600">
                ID: <span className="font-bold text-gray-900">{memberUID}</span>
              </p>
              {location && (
                <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{location}</span>
                </p>
              )}
            </div>
          </div>

          {/* Privacy Security Notice */}
          <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#0E8246] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-[#0E8246] block text-[11px]">
                {isBn ? 'গোপনীয়তা ও সুরক্ষা নিশ্চিত' : 'Privacy & Safety Protected'}
              </span>
              <p className="text-[10px] text-gray-600 leading-tight mt-0.5">
                {isBn 
                  ? 'ব্যবহারকারীর ব্যক্তিগত নম্বর উন্মুক্ত প্রদর্শন না করে সরাসরি ডিভাইসের ডায়াল প্যাড ও চ্যাটে সংযুক্ত করা হচ্ছে।' 
                  : 'The phone number is masked for privacy and feeds directly into your dialer/chat.'}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>{isBn ? 'মোবাইল নম্বর সম্পূর্ণ গোপন ও সুরক্ষিত' : 'Mobile Number Hidden & Protected'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Call, WhatsApp, Message) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Call Now */}
            <button
              type="button"
              onClick={handleCall}
              className="py-2.5 px-3 bg-[#0E8246] hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              id="role-contact-modal-call-btn"
            >
              <Phone className="w-4 h-4" />
              <span>{isBn ? 'যোগাযোগ করুন' : 'Contact / Call'}</span>
            </button>

            {/* WhatsApp Chat */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              id="role-contact-modal-wa-btn"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>{isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
            </button>
          </div>

          {/* Custom Message Sender */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-bold text-gray-700">
              {isBn ? 'সরাসরি মেসেজ বা অনুসন্ধান পাঠান:' : 'Send Direct Message / Inquiry:'}
            </label>
            <div className="relative">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={isBn ? 'আপনার প্রয়োজন বা প্রশ্ন এখানে লিখুন...' : 'Write your requirement or message here...'}
                rows={2}
                className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#0E8246] text-gray-900 resize-none"
                id="role-contact-modal-textarea"
              />
            </div>
            
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleSendSMS}
                className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                id="role-contact-modal-sms-btn"
              >
                <Send className="w-3.5 h-3.5 text-gray-600" />
                <span>{isBn ? 'এসএমএস পাঠান' : 'Send SMS'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#0E8246] border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                id="role-contact-modal-send-wa-btn"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0E8246]" />
                <span>{isBn ? 'চ্যাটে পাঠান' : 'Send to Chat'}</span>
              </button>
            </div>

            {messageSent && (
              <p className="text-[10px] text-emerald-700 font-bold text-center mt-1">
                ✓ {isBn ? 'মেসেজ অ্যাপ চালু করা হয়েছে।' : 'Messaging application opened.'}
              </p>
            )}
          </div>

          {/* Blood group emergency assistance note if relevant */}
          {bloodGroup && (
            <div className="p-2 bg-red-50/70 border border-red-200 rounded-xl text-[10px] text-red-800 flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-red-600 fill-red-600 shrink-0" />
              <span>
                {isBn 
                  ? `জরুরি রক্তের প্রয়োজন বা সহায়তায় রক্তের গ্রুপ (${bloodGroup}) অনুযায়ী সরাসরি যোগাযোগ করুন।` 
                  : `For blood emergency assistance (${bloodGroup}), reach out directly.`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
