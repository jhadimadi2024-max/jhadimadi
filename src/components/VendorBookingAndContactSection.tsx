import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  MessageSquare,
  MessageCircle,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  MapPin,
  User,
  Wallet,
  X,
  Send,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Language } from '../types';

export interface VendorProfileInfo {
  id?: string;
  code?: string;
  name?: string;
  fullName?: string;
  profession?: string;
  professionBn?: string;
  category?: string;
  categoryBn?: string;
  role?: string;
  phone?: string;
  realPhone?: string;
  whatsapp?: string;
  messengerUrl?: string;
  facebookUrl?: string;
  bkashNumber?: string;
  nagadNumber?: string;
  district?: string;
  upazila?: string;
  address?: string;
  hourlyRate?: string | number;
  fixedPrice?: string | number;
  avatar?: string;
  photoUrl?: string;
  isVerified?: boolean;
  servicesList?: Array<{ id: string; name: string; price?: number }>;
}

export interface VendorBookingAndContactSectionProps {
  vendor: VendorProfileInfo;
  isOwner?: boolean;
  lang?: Language | 'bn' | 'en' | string;
  onOpenJMessage?: (vendor: VendorProfileInfo) => void;
  onBookingConfirmed?: (bookingData: any) => void;
  defaultServiceName?: string;
  className?: string;
}

export const VendorBookingAndContactSection: React.FC<VendorBookingAndContactSectionProps> = ({
  vendor,
  isOwner = false,
  lang = 'bn',
  onOpenJMessage,
  onBookingConfirmed,
  defaultServiceName,
  className = ''
}) => {
  const isBn = lang === 'bn';

  // Modal and Interactive States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [copiedNagad, setCopiedNagad] = useState(false);

  // Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [serviceDate, setServiceDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('সকাল ৯:০০ - দুপুর ১২:০০');
  const [selectedService, setSelectedService] = useState(defaultServiceName || vendor.professionBn || vendor.categoryBn || 'সাধারণ সেবা');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('২০০');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReceipt, setConfirmedReceipt] = useState<any>(null);

  // Normalized Vendor Details
  const vendorName = vendor.fullName || vendor.name || 'ঝাদিমাদি ভেরিফাইড প্রোভাইডার';
  const vendorUniqueId = vendor.code || vendor.id || 'JH-PRO-001';
  const vendorProfession = vendor.professionBn || vendor.profession || vendor.categoryBn || vendor.category || 'পেশাদার সেবা প্রদানকারী';
  const rawPhone = String(vendor.whatsapp || vendor.phone || vendor.realPhone || '01870592699');
  const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
  
  // Format international 880 number for WhatsApp
  let waDigits = rawPhone.replace(/\D/g, '');
  if (waDigits.startsWith('0')) {
    waDigits = '88' + waDigits;
  } else if (!waDigits.startsWith('88') && waDigits.length === 10) {
    waDigits = '880' + waDigits;
  }
  if (!waDigits || waDigits.length < 10) {
    waDigits = '8801870592699';
  }

  // Official or vendor payment numbers
  const bkashNumber = vendor.bkashNumber || '01870592699';
  const nagadNumber = vendor.nagadNumber || '01870592699';

  // Category Pill Styling Resolver
  const getCategoryBadgeClass = (prof: string) => {
    const p = prof.toLowerCase();
    if (p.includes('ইলেকট্রিক') || p.includes('electric')) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    if (p.includes('পেইন্ট') || p.includes('paint')) {
      return 'bg-purple-100 text-purple-900 border-purple-300';
    }
    if (p.includes('শ্রমিক') || p.includes('labor')) {
      return 'bg-orange-100 text-orange-900 border-orange-300';
    }
    if (p.includes('নার্স') || p.includes('nurs') || p.includes('চিকিৎসা') || p.includes('স্বাস্থ্য')) {
      return 'bg-rose-100 text-rose-900 border-rose-300';
    }
    if (p.includes('স্থায়ী') || p.includes('সদস্য') || p.includes('member')) {
      return 'bg-blue-100 text-blue-900 border-blue-300';
    }
    if (p.includes('বিক্রেতা') || p.includes('seller') || p.includes('মার্চেন্ট') || p.includes('দোকান')) {
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  // Copy helper
  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
      }
    } catch (_) {}
  };

  // Communication Handlers
  const handleDirectCall = () => {
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleWhatsAppMessage = () => {
    const text = encodeURIComponent(
      `আসসালামু আলাইকুম ${vendorName} (আইডি: ${vendorUniqueId})। আমি ঝাদিমাদি ডট কম (Jhadimadi.com) থেকে আপনার "${vendorProfession}" সেবা/পণ্যের বিষয়ে যোগাযোগ করছি। বিস্তারিত আলোচনা করতে চাচ্ছি।`
    );
    window.open(`https://wa.me/${waDigits}?text=${text}`, '_blank');
  };

  const handleWhatsAppCall = () => {
    // WhatsApp direct call link via wa.me intent
    window.open(`https://wa.me/${waDigits}`, '_blank');
  };

  const handleFacebookMessenger = () => {
    if (vendor.messengerUrl && vendor.messengerUrl.trim()) {
      window.open(vendor.messengerUrl.trim(), '_blank');
      return;
    }
    // Default to official Jhadimadi CHT Facebook Messenger
    window.open('https://m.me/jhadimadi', '_blank');
  };

  const handleTidioLiveChat = () => {
    try {
      // Check if global Tidio widget is loaded on window
      const tidioApi = (window as any).tidioChatApi;
      if (tidioApi) {
        if (typeof tidioApi.show === 'function') tidioApi.show();
        if (typeof tidioApi.open === 'function') tidioApi.open();
        return;
      }
    } catch (_) {}

    // Fallback if Tidio script is still hydrating: trigger JMessage
    handleTriggerJMessage();
  };

  const handleTriggerJMessage = () => {
    if (onOpenJMessage) {
      onOpenJMessage(vendor);
      return;
    }
    // Dispatch global event for in-site chat modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-jhadimadi-chat', {
          detail: {
            vendorId: vendorUniqueId,
            vendorName,
            profession: vendorProfession,
            phone: cleanPhone
          }
        })
      );
      window.dispatchEvent(
        new CustomEvent('open-jmessage', {
          detail: {
            vendorId: vendorUniqueId,
            vendorName,
            profession: vendorProfession
          }
        })
      );
    }
  };

  // Handle Booking Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert(isBn ? 'অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা পূরণ করুন।' : 'Please fill in your name, phone, and address.');
      return;
    }

    setIsSubmitting(true);

    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    const newBooking = {
      bookingId,
      vendorId: vendorUniqueId,
      vendorName,
      vendorProfession,
      vendorPhone: cleanPhone,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      serviceName: selectedService,
      serviceDate,
      timeSlot,
      additionalNotes: additionalNotes.trim(),
      paymentMethod: paymentMethod.toUpperCase(),
      advanceAmount: paymentMethod !== 'cod' ? advanceAmount : '০',
      transactionId: transactionId.trim() || 'N/A',
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    // Save to localStorage for instant client persistence
    try {
      const existing = JSON.parse(localStorage.getItem('jhadimadi_vendor_bookings') || '[]');
      existing.unshift(newBooking);
      localStorage.setItem('jhadimadi_vendor_bookings', JSON.stringify(existing));
    } catch (_) {}

    // Send to backend orders API
    try {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: bookingId,
          type: 'SERVICE_BOOKING',
          vendorId: vendorUniqueId,
          vendorName,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: customerAddress.trim(),
          notes: `Service: ${selectedService} | Date: ${serviceDate} (${timeSlot}) | Payment: ${paymentMethod} | Trx: ${transactionId || 'COD'}`,
          totalAmount: paymentMethod !== 'cod' ? parseInt(advanceAmount || '0', 10) : 0
        })
      }).catch(() => {});
    } catch (_) {}

    if (onBookingConfirmed) {
      onBookingConfirmed(newBooking);
    }

    setIsSubmitting(false);
    setConfirmedReceipt(newBooking);
  };

  return (
    <div className={`space-y-4 font-sans ${className}`} id="vendor-unified-profile-booking">
      
      {/* =========================================================================
          1. VENDOR INFORMATION HEADER
          - Vendor Name & Unique ID / Code Number
          - Profession / Category (Electrician, Painter, Daily Labor, Nursing, General Member, Product Seller, etc.)
          - Service location & Verified credentials badge
         ========================================================================= */}
      <div 
        className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3.5"
        id="vendor-info-header-block"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                {vendorName}
              </h2>
              {vendor.isVerified !== false && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isBn ? 'ভেরিফাইড' : 'Verified'}</span>
                </span>
              )}
            </div>

            {/* Profession / Category Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getCategoryBadgeClass(vendorProfession)}`}>
                {vendorProfession}
              </span>

              {(vendor.upazila || vendor.district) && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{vendor.upazila ? `${vendor.upazila}, ` : ''}{vendor.district || 'খাগড়াছড়ি'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Unique ID / Code Number with 1-click copy */}
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-gray-200">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">
                {isBn ? 'ইউনিক কোড / আইডি' : 'Unique ID / Code'}
              </span>
              <span className="font-mono font-black text-xs sm:text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                {vendorUniqueId}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(vendorUniqueId, setCopiedId)}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer"
              title={isBn ? 'আইডি কপি করুন' : 'Copy ID'}
              aria-label="Copy Vendor Code"
            >
              {copiedId ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Rate & Availability Bar */}
        {(vendor.hourlyRate || vendor.fixedPrice) && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-700">
            <span className="font-semibold text-gray-600">
              {isBn ? 'নির্ধারিত পারিশ্রমিক / মূল্য:' : 'Rate / Fee:'}
            </span>
            <span className="font-black text-gray-950 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
              ৳{vendor.hourlyRate || vendor.fixedPrice} {vendor.hourlyRate ? (isBn ? '/ ঘণ্টা বা কাজ' : '/ hour') : ''}
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. BOOKING & PAYMENT SECTION
          - Prominent "বুকিং কনফার্ম করুন" (Confirm Booking) button
          - Payment Options (Nagad / Bkash advance/payment details + COD)
         ========================================================================= */}
      <div 
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40 border border-emerald-200 shadow-2xs space-y-3.5"
        id="vendor-booking-section-card"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-950">
                {isBn ? 'সেবা ও বুকিং বুকিং সেকশন' : 'Service & Booking Section'}
              </h3>
              <p className="text-[11px] text-gray-600">
                {isBn ? 'নিরাপদে সেবা বা পণ্য নিশ্চিত করুন এবং অগ্রিম পরিশোধ করুন' : 'Confirm service/order with secure payment'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{isBn ? 'পেমেন্ট নম্বর দেখুন' : 'Payment Details'}</span>
          </button>
        </div>

        {/* Action Button: "বুকিং কনফার্ম করুন" (Confirm Booking) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#008055] hover:bg-[#006e48] active:scale-[0.99] text-white text-sm font-black transition duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            id="btn-vendor-confirm-booking-prominent"
          >
            <CalendarCheck className="w-4 h-4 text-white shrink-0" />
            <span>{isBn ? 'বুকিং কনফার্ম করুন' : 'Confirm Booking'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-gray-50 active:scale-[0.99] text-gray-900 border-2 border-emerald-600/30 text-xs sm:text-sm font-black transition duration-150 flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            id="btn-vendor-view-payments"
          >
            <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{isBn ? 'বিকাশ / নগদ পেমেন্ট তথ্য' : 'bKash / Nagad Payment'}</span>
          </button>
        </div>

        {/* Integrated Payment Pill Badges */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-500">
              {isBn ? 'সাপোর্টেড পেমেন্ট:' : 'Accepted Payments:'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pink-50 border border-pink-200 text-pink-700 font-bold text-[11px]">
              বিকাশ (bKash)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700 font-bold text-[11px]">
              নগদ (Nagad)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[11px]">
              ক্যাশ অন ডেলিভারি (COD)
            </span>
          </div>

          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
            ✓ ১০০% নিরাপদ ট্রানজেকশন
          </span>
        </div>
      </div>

      {/* =========================================================================
          3. CONTACT & COMMUNICATION OPTIONS
          - টিডিও লাইভ চ্যাট (Tidio Chat)
          - ঝাদিমাদি মেসেজ (JMessage)
          - হোয়াটসঅ্যাপ মেসেজ (WhatsApp Message)
          - হোয়াটসঅ্যাপ কল (WhatsApp Call)
          - সরাসরি ফোন কল (Direct Phone Call)
          - ফেসবুক মেসেঞ্জার (Facebook Messenger)
         ========================================================================= */}
      <div 
        className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3.5"
        id="vendor-contact-communication-block"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-950">
                {isBn ? 'সরাসরি যোগাযোগ মাধ্যম' : 'Contact & Communication Channels'}
              </h3>
              <p className="text-[11px] text-gray-600">
                {isBn ? 'আপনার সুবিধাজনক চ্যানেলে সরাসরি প্রোভাইডারের সাথে যোগাযোগ করুন' : 'Reach out via your preferred channel'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Grid: 6 Actionable Communication Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          
          {/* 1. সরাসরি ফোন কল (Direct Phone Call) */}
          <button
            type="button"
            onClick={handleDirectCall}
            className="w-full py-3 px-3.5 rounded-xl bg-black hover:bg-gray-900 active:scale-[0.98] text-white text-xs font-black transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            id="vendor-contact-direct-call"
            title={isOwner ? cleanPhone : (isBn ? 'সরাসরি কল করুন' : 'Direct Call')}
          >
            <Phone className="w-4 h-4 text-white shrink-0" />
            <span>{isBn ? 'সরাসরি ফোন কল' : 'Direct Phone Call'}</span>
          </button>

          {/* 2. হোয়াটসঅ্যাপ মেসেজ (WhatsApp Message) */}
          <button
            type="button"
            onClick={handleWhatsAppMessage}
            className="w-full py-3 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white text-xs font-black transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            id="vendor-contact-whatsapp-message"
          >
            <MessageSquare className="w-4 h-4 text-white shrink-0" />
            <span>{isBn ? 'হোয়াটসঅ্যাপ মেসেজ' : 'WhatsApp Message'}</span>
          </button>

          {/* 3. হোয়াটসঅ্যাপ কল (WhatsApp Call) */}
          <button
            type="button"
            onClick={handleWhatsAppCall}
            className="w-full py-3 px-3.5 rounded-xl bg-[#128C7E] hover:bg-[#0e7468] active:scale-[0.98] text-white text-xs font-black transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            id="vendor-contact-whatsapp-call"
          >
            <PhoneCall className="w-4 h-4 text-white shrink-0" />
            <span>{isBn ? 'হোয়াটসঅ্যাপ কল' : 'WhatsApp Call'}</span>
          </button>

          {/* 4. ঝাদিমাদি মেসেজ (JMessage) */}
          <button
            type="button"
            onClick={handleTriggerJMessage}
            className="w-full py-3 px-3.5 rounded-xl bg-[#008055] hover:bg-[#006e48] active:scale-[0.98] text-white text-xs font-black transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            id="vendor-contact-jmessage"
          >
            <Send className="w-4 h-4 text-white shrink-0" />
            <span>{isBn ? 'ঝাদিমাদি মেসেজ (JMessage)' : 'JMessage Direct'}</span>
          </button>

          {/* 5. টিডিও লাইভ চ্যাট (Tidio Live Chat) */}
          <button
            type="button"
            onClick={handleTidioLiveChat}
            className="w-full py-3 px-3.5 rounded-xl bg-[#0055FE] hover:bg-[#0047d4] active:scale-[0.98] text-white text-xs font-black transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            id="vendor-contact-tidio-chat"
          >
            <MessageCircle className="w-4 h-4 text-white shrink-0" />
            <span>{isBn ? 'টিডিও লাইভ চ্যাট' : 'Tidio Live Chat'}</span>
          </button>

          {/* 6. ফেসবুক মেসেঞ্জার (Facebook Messenger) */}
          <button
            type="button"
            onClick={handleFacebookMessenger}
            className="w-full py-3 px-3.5 rounded-xl bg-[#0084FF] hover:bg-[#0074e0] active:scale-[0.98] text-white text-xs font-black transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            id="vendor-contact-messenger"
          >
            <ExternalLink className="w-4 h-4 text-white shrink-0" />
            <span>{isBn ? 'ফেসবুক মেসেঞ্জার' : 'FB Messenger'}</span>
          </button>

        </div>
      </div>

      {/* =========================================================================
          MODAL 1: BOOKING CONFIRMATION FORM MODAL
         ========================================================================= */}
      {isBookingModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => {
            if (!isSubmitting) setIsBookingModalOpen(false);
          }}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-black">
                    {isBn ? 'বুকিং ফর্ম পূরণ করুন' : 'Confirm Service Booking'}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    {vendorName} ({vendorUniqueId})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-lg hover:bg-emerald-800 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Confirmed Receipt View */}
            {confirmedReceipt ? (
              <div className="p-5 sm:p-6 space-y-4 text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-gray-950">
                    {isBn ? 'বুকিং সফলভাবে সম্পন্ন হয়েছে!' : 'Booking Confirmed Successfully!'}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {isBn ? 'আপনার বুকিং ভাউচার ও রসিদ প্রস্তুত করা হয়েছে।' : 'Your booking voucher is ready.'}
                  </p>
                </div>

                {/* Voucher Card */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500 font-bold">{isBn ? 'বুকিং আইডি:' : 'Booking ID:'}</span>
                    <span className="font-mono font-black text-gray-900">{confirmedReceipt.bookingId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{isBn ? 'প্রোভাইডার / বিক্রেতা:' : 'Provider:'}</span>
                    <span className="font-bold text-gray-900">{confirmedReceipt.vendorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{isBn ? 'সেবা:' : 'Service:'}</span>
                    <span className="font-semibold text-gray-900">{confirmedReceipt.serviceName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{isBn ? 'তারিখ ও সময়:' : 'Date & Time:'}</span>
                    <span className="font-semibold text-gray-900">{confirmedReceipt.serviceDate} ({confirmedReceipt.timeSlot})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{isBn ? 'পেমেন্ট মাধ্যম:' : 'Payment:'}</span>
                    <span className="font-bold text-emerald-700">{confirmedReceipt.paymentMethod}</span>
                  </div>
                </div>

                {/* Send details to WhatsApp */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `*নতুন বুকিং রসিদ - ঝাদিমাদি ডট কম*\n` +
                        `বুকিং আইডি: ${confirmedReceipt.bookingId}\n` +
                        `প্রোভাইডার: ${confirmedReceipt.vendorName} (${confirmedReceipt.vendorId})\n` +
                        `গ্রাহকের নাম: ${confirmedReceipt.customerName}\n` +
                        `মোবাইল: ${confirmedReceipt.customerPhone}\n` +
                        `ঠিকানা: ${confirmedReceipt.customerAddress}\n` +
                        `সেবা: ${confirmedReceipt.serviceName}\n` +
                        `তারিখ: ${confirmedReceipt.serviceDate} (${confirmedReceipt.timeSlot})\n` +
                        `পেমেন্ট: ${confirmedReceipt.paymentMethod} (অগ্রিম: ৳${confirmedReceipt.advanceAmount}, Trx: ${confirmedReceipt.transactionId})\n` +
                        `অনুগ্রহ করে দ্রুত নিশ্চিত করুন।`
                      );
                      window.open(`https://wa.me/${waDigits}?text=${msg}`, '_blank');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isBn ? 'হোয়াটসঅ্যাপে বুকিং স্লিপ পাঠান' : 'Send Booking Slip to WhatsApp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedReceipt(null);
                      setIsBookingModalOpen(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
                  >
                    {isBn ? 'বন্ধ করুন' : 'Close'}
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleBookingSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
                
                {/* Selected Service */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isBn ? 'নির্বাচিত সেবা বা পণ্যের বিবরণ' : 'Selected Service / Produce'}
                  </label>
                  <input
                    type="text"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    required
                    placeholder="যেমন: ওয়্যারিং ও সুইচ মেরামত / পেইন্টিং / অর্গানিক পণ্য ডেলিভারি"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Customer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? 'আপনার পূর্ণ নাম *' : 'Your Full Name *'}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      placeholder="যেমন: রবিন চাকমা"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      placeholder="018XXXXXXXX"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isBn ? 'সেবা গ্রহণের সম্পূর্ণ ঠিকানা *' : 'Delivery / Service Address *'}
                  </label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                    rows={2}
                    placeholder="বাড়ি/দোকান নং, রাস্তা, এলাকা, উপজেলা, জেলা"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? 'প্রয়োজনীয় তারিখ' : 'Required Date'}
                    </label>
                    <input
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? 'সময় নির্ধারণ' : 'Time Slot'}
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="সকাল ৯:০০ - দুপুর ১২:০০">সকাল ৯:০০ - দুপুর ১২:০০</option>
                      <option value="দুপুর ১২:০০ - বিকাল ৩:০০">দুপুর ১২:০০ - বিকাল ৩:০০</option>
                      <option value="বিকাল ৩:০০ - সন্ধ্যা ৬:০০">বিকাল ৩:০০ - সন্ধ্যা ৬:০০</option>
                      <option value="সন্ধ্যা ৬:০০ - রাত ৯:০০">সন্ধ্যা ৬:০০ - রাত ৯:০০</option>
                      <option value="জরুরি / তাৎক্ষণিক">জরুরি / তাৎক্ষণিক</option>
                    </select>
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                  <label className="block text-xs font-bold text-gray-900">
                    {isBn ? 'পেমেন্ট পদ্ধতি নির্বাচন করুন:' : 'Select Payment Method:'}
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                        paymentMethod === 'cod'
                          ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                          : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100 text-xs font-medium'
                      }`}
                    >
                      <span className="text-[11px] block">{isBn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Service'}</span>
                      <span className="text-[9px] opacity-80 block">{isBn ? 'কাজের পর' : 'After Work'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bkash')}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                        paymentMethod === 'bkash'
                          ? 'bg-pink-600 text-white border-pink-700 font-bold'
                          : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100 text-xs font-medium'
                      }`}
                    >
                      <span className="text-[11px] block">বিকাশ (bKash)</span>
                      <span className="text-[9px] opacity-80 block">{isBn ? 'অগ্রিম/ফুল' : 'Advance'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('nagad')}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                        paymentMethod === 'nagad'
                          ? 'bg-orange-600 text-white border-orange-700 font-bold'
                          : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100 text-xs font-medium'
                      }`}
                    >
                      <span className="text-[11px] block">নগদ (Nagad)</span>
                      <span className="text-[9px] opacity-80 block">{isBn ? 'অগ্রিম/ফুল' : 'Advance'}</span>
                    </button>
                  </div>

                  {/* If bKash or Nagad selected, show TrxID & Number */}
                  {paymentMethod !== 'cod' && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2 animate-fadeIn text-xs">
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="font-semibold">
                          {paymentMethod === 'bkash' ? 'বিকাশ নম্বর:' : 'নগদ নম্বর:'}
                        </span>
                        <span className="font-mono font-bold text-gray-900">
                          {paymentMethod === 'bkash' ? bkashNumber : nagadNumber}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                            {isBn ? 'অগ্রিম পরিমাণ (টাকা)' : 'Advance Amount (BDT)'}
                          </label>
                          <input
                            type="number"
                            value={advanceAmount}
                            onChange={(e) => setAdvanceAmount(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                            {isBn ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="যেমন: 9K8X2..."
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#008055] hover:bg-[#006e48] active:scale-[0.99] text-white text-sm font-black transition duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>{isSubmitting ? (isBn ? 'বুকিং হচ্ছে...' : 'Confirming...') : (isBn ? 'বুকিং চূড়ান্তভাবে নিশ্চিত করুন' : 'Finalize & Submit Booking')}</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: INTEGRATED BKASH & NAGAD PAYMENT OPTIONS MODAL
         ========================================================================= */}
      {isPaymentModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsPaymentModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-base font-black">
                    {isBn ? 'পেমেন্ট ও ট্রানজেকশন তথ্য' : 'Payment & Transaction Options'}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    {vendorName} ({vendorUniqueId})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg hover:bg-emerald-800 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {isBn 
                  ? 'নিচের বিকাশ বা নগদ নম্বরে সরাসরি অগ্রিম বা সার্ভিস ফি পরিশোধ করতে পারেন। টাকা পাঠানোর পর ট্রানজেকশন আইডি সংরক্ষণ করুন।'
                  : 'You can disburse payments or booking advance directly using the Bkash or Nagad numbers below.'}
              </p>

              {/* bKash Card */}
              <div className="p-4 rounded-xl bg-pink-50/70 border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-pink-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-600"></span>
                    <span>বিকাশ (bKash) পার্সোনাল / মার্চেন্ট</span>
                  </span>
                  <span className="text-[10px] bg-pink-200/80 text-pink-900 px-2 py-0.5 rounded font-bold">
                    Send Money / Payment
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-pink-200">
                  <span className="font-mono font-black text-sm text-gray-900">
                    {bkashNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bkashNumber, setCopiedBkash)}
                    className="px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBkash ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Nagad Card */}
              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                    <span>নগদ (Nagad) পার্সোনাল / মার্চেন্ট</span>
                  </span>
                  <span className="text-[10px] bg-orange-200/80 text-orange-900 px-2 py-0.5 rounded font-bold">
                    Send Money / Cash-in
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-orange-200">
                  <span className="font-mono font-black text-sm text-gray-900">
                    {nagadNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(nagadNumber, setCopiedNagad)}
                    className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedNagad ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Cash On Delivery Notice */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-2.5 text-xs text-gray-700">
                <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-900 block">ক্যাশ অন ডেলিভারি / সেবা শেষে পরিশোধ:</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    কোনো প্রকার অগ্রিম ছাড়াই কাজ বা পণ্য হস্তান্তরের সময় সরাসরি নগদ টাকা পরিশোধ করার সুবিধা রয়েছে।
                  </p>
                </div>
              </div>

              {/* Close / Go to booking */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="py-2.5 px-3 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-800 text-xs font-bold transition cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setIsBookingModalOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition cursor-pointer"
                >
                  {isBn ? 'বুকিং ফর্মে যান →' : 'Proceed to Booking →'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VendorBookingAndContactSection;
