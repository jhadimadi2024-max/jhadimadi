import React, { useState } from 'react';
import { 
  X, CheckCircle2, Phone, MapPin, Truck, Wrench, ShoppingBag, 
  Send, Sparkles, AlertCircle, RefreshCw, ShieldCheck, Calendar, Clock, User, FileText
} from 'lucide-react';
import { Language, District } from '../types';

interface ServiceOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  defaultDistrict?: District | string;
  defaultCategory?: 'service' | 'ecommerce' | 'logistics' | 'freelance';
  onSuccess?: (order: any) => void;
}

export const ServiceOrderFormModal: React.FC<ServiceOrderFormModalProps> = ({
  isOpen,
  onClose,
  lang = 'bn',
  defaultDistrict = 'Rangamati',
  defaultCategory = 'service',
  onSuccess,
}) => {
  // Step 1: Customer Information
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(defaultDistrict || 'Rangamati');
  const [upazila, setUpazila] = useState<string>('রাঙ্গামাটি সদর (Rangamati Sadar)');

  // Step 2: Service / Product Type Dropdown
  const [serviceType, setServiceType] = useState<string>(
    defaultCategory === 'ecommerce' ? 'organic_purchase' :
    defaultCategory === 'logistics' ? 'logistics_delivery' :
    defaultCategory === 'freelance' ? 'freelance_skill' : 'ondemand_technician'
  );

  // Step 3: Custom Requirement / Details
  const [customRequirement, setCustomRequirement] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Step 4: Preferred Date & Time
  const todayStr = new Date().toISOString().split('T')[0];
  const [preferredDate, setPreferredDate] = useState(todayStr);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('সকাল ১০:০০ - দুপুর ১:০০ (Morning 10 AM - 1 PM)');
  const [urgentDelivery, setUrgentDelivery] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন।' : 'Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে সঠিক মোবাইল নম্বর লিখুন।' : 'Please enter a valid phone number.');
      return;
    }
    if (!deliveryAddress.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে ঠিকানা বা লোকেশন লিখুন।' : 'Please enter your address.');
      return;
    }
    if (!customRequirement.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে সার্ভিসের বিস্তারিত বিবরণ লিখুন।' : 'Please enter detailed requirements.');
      return;
    }

    setIsSubmitting(true);
    const orderId = 'JM-' + Math.floor(100000 + Math.random() * 900000);

    const typeLabels: Record<string, string> = {
      organic_purchase: 'অর্গানিক ই-কমার্স পণ্য (Organic Purchase)',
      ondemand_technician: 'অন-ডিমান্ড কারিগর ও মেরামত (On-Demand Technician)',
      logistics_delivery: 'লজিস্টিকস ও পার্সেল কুরিয়ার (Logistics & Delivery)',
      freelance_skill: 'ফ্রিল্যান্স স্কিল সার্ভিস (Freelance Skill Request)'
    };

    const orderPayload = {
      orderId,
      customerName: fullName.trim(),
      customerPhone: phone.trim(),
      district: selectedDistrict,
      upazila,
      serviceType,
      serviceTypeLabel: typeLabels[serviceType] || serviceType,
      address: deliveryAddress.trim(),
      details: customRequirement.trim(),
      preferredDate,
      preferredTime: preferredTimeSlot,
      urgent: urgentDelivery,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      assignedProvider: 'ঝাদিমাদি ভেরিফাইড প্রোভাইডার টিম'
    };

    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
    } catch (err) {
      console.warn('Fallback local order sync:', err);
    }

    // Save to local storage order history
    try {
      const existing = localStorage.getItem('jhadimadi_my_orders');
      const orderList = existing ? JSON.parse(existing) : [];
      orderList.unshift(orderPayload);
      localStorage.setItem('jhadimadi_my_orders', JSON.stringify(orderList));
    } catch (e) {
      console.warn(e);
    }

    setIsSubmitting(false);
    setConfirmedOrderId(orderId);
    setIsSuccessSubmitted(true);
    if (onSuccess) onSuccess(orderPayload);
  };

  const handleResetAndClose = () => {
    setIsSuccessSubmitted(false);
    setFullName('');
    setPhone('');
    setDeliveryAddress('');
    setCustomRequirement('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 text-slate-800 my-auto flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150"
        id="service-booking-order-modal"
      >
        
        {/* Header Bar - Leaf Green Theme */}
        <div className="bg-[#8BC34A] text-slate-950 p-4 sm:p-5 flex items-center justify-between border-b border-[#7CB342]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/40 border border-white/60 flex items-center justify-center text-slate-950 font-black shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight text-slate-950">
                সার্ভিস অর্ডার ও রিকোয়েস্ট ফর্ম
              </h3>
              <p className="text-[11px] font-bold text-slate-900/80">
                Jhadimadi.com • Instant Service & Booking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-black/10 hover:bg-black/20 text-slate-950 rounded-xl cursor-pointer transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccessSubmitted ? (
          /* Confirmation Success Screen */
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-lime-100 text-[#689F38] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">অর্ডার সফলভাবে গ্রহণ করা হয়েছে!</h4>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                অর্ডার ট্র্যাকিং আইডি: <span className="font-mono font-bold text-[#689F38]">{confirmedOrderId}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">গ্রাহকের নাম:</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মোবাইল নম্বর:</span>
                <span className="font-bold text-slate-900">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">এলাকা ও উপজেলা:</span>
                <span className="font-bold text-slate-900">{selectedDistrict} • {upazila}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সার্ভিস ক্যাটাগরি:</span>
                <span className="font-bold text-[#689F38]">
                  {serviceType === 'organic_purchase' ? 'অর্গানিক ই-কমার্স' :
                   serviceType === 'ondemand_technician' ? 'অন-ডিমান্ড কারিগর' :
                   serviceType === 'logistics_delivery' ? 'লজিস্টিকস ও কুরিয়ার' : 'ফ্রিল্যান্স স্কিল'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">তারিখ ও সময়:</span>
                <span className="font-semibold text-slate-900">{preferredDate} • {preferredTimeSlot.split('(')[0]}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              নিকটস্থ ভেরিফাইড প্রোভাইডার / প্রতিনিধি অতিদ্রুত আপনার ঠিকানায় পৌঁছাবেন বা ফোনে যোগাযোগ করবেন।
            </p>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3 bg-[#8BC34A] hover:bg-[#7CB342] text-slate-950 text-xs font-black rounded-xl shadow-md cursor-pointer transition active:scale-95"
            >
              ঠিক আছে (Close & View Orders)
            </button>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
            
            {/* 1. Customer Info */}
            <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#8BC34A] text-slate-950 text-[11px] font-black flex items-center justify-center">১</span>
                <span>গ্রাহকের তথ্য (Customer Information)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">পূর্ণ নাম (Customer Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden focus:border-[#8BC34A] focus:ring-1 focus:ring-[#8BC34A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর (Phone Number) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="০১৭XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-hidden focus:border-[#8BC34A] focus:ring-1 focus:ring-[#8BC34A]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">জেলা (District) *</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden focus:border-[#8BC34A]"
                  >
                    <option value="Rangamati">রাঙ্গামাটি (Rangamati)</option>
                    <option value="Khagrachhari">খাগড়াছড়ি (Khagrachhari)</option>
                    <option value="Bandarban">বান্দরবান (Bandarban)</option>
                    <option value="Chattogram">চট্টগ্রাম (Chattogram)</option>
                    <option value="Dhaka">ঢাকা (Dhaka)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">উপজেলা / এলাকা (Upazila / Area):</label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden focus:border-[#8BC34A]"
                >
                  <option value="রাঙ্গামাটি সদর (Rangamati Sadar)">রাঙ্গামাটি সদর (Rangamati Sadar)</option>
                  <option value="কাপ্তাই (Kaptai)">কাপ্তাই (Kaptai)</option>
                  <option value="বাঘাইছড়ি / সাজেক (Baghaichhari / Sajek)">বাঘাইছড়ি / সাজেক (Baghaichhari / Sajek)</option>
                  <option value="কাউখালী (Kawkhali)">কাউখালী (Kawkhali)</option>
                  <option value="নানিয়ারচর (Naniarchar)">নানিয়ারচর (Naniarchar)</option>
                  <option value="বরকল (Barkal)">বরকল (Barkal)</option>
                  <option value="খাগড়াছড়ি সদর (Khagrachhari Sadar)">খাগড়াছড়ি সদর (Khagrachhari Sadar)</option>
                  <option value="বান্দরবান সদর (Bandarban Sadar)">বান্দরবান সদর (Bandarban Sadar)</option>
                </select>
              </div>
            </div>

            {/* 2. Service / Product Type Dropdown */}
            <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#8BC34A] text-slate-950 text-[11px] font-black flex items-center justify-center">২</span>
                <span>সার্ভিস বা পণ্যের ধরণ (Service / Product Type)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ধরণ নির্বাচন করুন (Select Type) *</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden focus:border-[#8BC34A]"
                >
                  <option value="ondemand_technician">🛠️ অন-ডিমান্ড টেকনিশিয়ান ও হোম রিপেয়ার (On-Demand Technician)</option>
                  <option value="organic_purchase">🛍️ সিএইচটি খাঁটি অর্গানিক পণ্য ক্রয় (CHT Organic Store)</option>
                  <option value="logistics_delivery">🚚 লজিস্টিকস ও পার্সেল এক্সপ্রেস ডেলিভারি (Logistics & Courier)</option>
                  <option value="freelance_skill">💼 ফ্রিল্যান্স স্কিল ও স্পেশাল সার্ভিস (Freelance Skill Request)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ডেলিভারি / সার্ভিসের পূর্ণ ঠিকানা (Address) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: তবলছড়ি বাজার রোড, হাউজ #১২, রাঙ্গামাটি"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-[#8BC34A]"
                />
              </div>
            </div>

            {/* 3. Custom Requirement / Text Field */}
            <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#8BC34A] text-slate-950 text-[11px] font-black flex items-center justify-center">৩</span>
                <span>বিস্তারিত কাজের চাহিদা (Custom Requirement)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  প্রয়োজনীয় সার্ভিস বা পণ্যের বিস্তারিত বিবরণ লিখুন *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="যেমন: এসির গ্যাস লিক মেরামত অথবা ২ কেজি পাহাড়ি মধু ও ১ জোড়া থামি প্রয়োজন..."
                  value={customRequirement}
                  onChange={(e) => setCustomRequirement(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-[#8BC34A]"
                />
              </div>
            </div>

            {/* 4. Preferred Date & Time Picker */}
            <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#8BC34A] text-slate-950 text-[11px] font-black flex items-center justify-center">৪</span>
                <span>পছন্দের তারিখ ও সময় (Preferred Date & Time)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#689F38]" />
                    তারিখ (Date):
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-[#8BC34A]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#689F38]" />
                    সময় স্লট (Time Slot):
                  </label>
                  <select
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-[#8BC34A]"
                  >
                    <option value="সকাল ১০:০০ - দুপুর ১:০০ (Morning 10 AM - 1 PM)">সকাল ১০:০০ - দুপুর ১:০০</option>
                    <option value="দুপুর ২:০০ - বিকাল ৫:০০ (Afternoon 2 PM - 5 PM)">দুপুর ২:০০ - বিকাল ৫:০০</option>
                    <option value="সন্ধ্যা ৬:০০ - রাত ৯:০০ (Evening 6 PM - 9 PM)">সন্ধ্যা ৬:০০ - রাত ৯:০০</option>
                    <option value="যেকোনো সময় (Anytime)">যেকোনো সময় (Anytime)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgentModalCheck"
                  checked={urgentDelivery}
                  onChange={(e) => setUrgentDelivery(e.target.checked)}
                  className="w-4 h-4 accent-[#8BC34A] rounded-md cursor-pointer"
                />
                <label htmlFor="urgentModalCheck" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                  জরুরি অন-স্পট সার্ভিস / দ্রুত ডেলিভারি প্রয়োজন
                </label>
              </div>
            </div>

            {/* Submit Action Button in Light Leaf Green */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                id="btn-submit-service-order"
                className="w-full py-3.5 bg-[#8BC34A] hover:bg-[#7CB342] text-slate-950 text-xs sm:text-sm font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>অর্ডার প্রসেস হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>অর্ডার নিশ্চিত করুন (Submit Request)</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
