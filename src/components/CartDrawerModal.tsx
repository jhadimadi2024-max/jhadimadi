import React, { useState, useEffect } from 'react';
import { StoreProduct } from '../data/productsData';
import { useData } from '../context/DataContext';
import { databaseService } from '../services/databaseService';
import { otpService } from '../services/otpService';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Clock, 
  Sparkles,
  MessageSquare,
  AlertCircle,
  KeyRound,
  RotateCw,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { Language, getTranslation } from '../utils/translations';
import { 
  sanitizeName, 
  sanitizePhone, 
  sanitizeAddress, 
  isValidBangladeshPhone 
} from '../utils/securitySanitizer';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

export interface CartItemType {
  product: StoreProduct;
  quantity: number;
}

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemType[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  lang?: Language;
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  lang = 'bn'
}) => {
  const { addOrder } = useData();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Direct_Contact'>('COD');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderTrackingId, setOrderTrackingId] = useState('');
  const [validationError, setValidationError] = useState('');
  const [assignedRider, setAssignedRider] = useState<{ driverName: string; phone: string } | null>(null);

  // OTP Verification States for Beta Spam Prevention
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpMessage, setOtpMessage] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [copiedTrackId, setCopiedTrackId] = useState(false);

  const t = getTranslation(lang);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Auto-detect if this phone was already verified in this session
  useEffect(() => {
    const clean = customerPhone.replace(/[^0-9]/g, '');
    if (clean.length === 11 && otpService.isPhoneVerified(clean)) {
      setIsPhoneVerified(true);
      setOtpMessage(lang === 'bn' ? '✓ পূর্ববর্তী সেশনে নম্বরটি যাচাইকৃত' : '✓ Phone verified in this session');
    } else if (clean.length !== 11) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpMessage('');
    }
  }, [customerPhone, lang]);

  // Handle Escape key to close cart
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryCharge = subtotal > 0 ? (subtotal >= 2000 ? 0 : 60) : 0;
  const totalAmount = subtotal + deliveryCharge;

  // Handle Sending OTP
  const handleSendOtp = async () => {
    setValidationError('');
    setOtpMessage('');
    const clean = sanitizePhone(customerPhone);

    if (!isValidBangladeshPhone(clean)) {
      setValidationError(
        lang === 'bn'
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01812345678)'
          : 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01812345678)'
      );
      return;
    }

    setIsOtpSending(true);
    try {
      const res = await otpService.sendOtp(clean);
      if (res.success) {
        setOtpSent(true);
        setOtpCountdown(30);
        setOtpMessage(res.message);
      } else {
        setValidationError(res.message);
      }
    } catch {
      setValidationError(lang === 'bn' ? 'ওটিপি পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' : 'Failed to send OTP. Please try again.');
    } finally {
      setIsOtpSending(false);
    }
  };

  // Handle Verifying OTP
  const handleVerifyOtp = async () => {
    setValidationError('');
    const cleanPhone = sanitizePhone(customerPhone);
    const cleanCode = otpCode.replace(/[^0-9]/g, '').trim();

    if (cleanCode.length < 4) {
      setValidationError(lang === 'bn' ? 'অনুগ্রহ করে ৪ ডিজিটের ওটিপি কোড লিখুন' : 'Please enter 4-digit OTP code');
      return;
    }

    setIsOtpVerifying(true);
    try {
      const res = await otpService.verifyOtp(cleanPhone, cleanCode);
      if (res.success) {
        setIsPhoneVerified(true);
        setOtpMessage(lang === 'bn' ? '✓ মোবাইল নম্বর সফলভাবে যাচাই হয়েছে!' : '✓ Phone number verified successfully!');
        setValidationError('');
      } else {
        setValidationError(res.message || (lang === 'bn' ? 'ওটিপি কোড সঠিক নয়' : 'Invalid OTP code'));
      }
    } catch {
      setValidationError(lang === 'bn' ? 'ওটিপি যাচাইয়ে সমস্যা হয়েছে।' : 'Error during OTP verification.');
    } finally {
      setIsOtpVerifying(false);
    }
  };

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (cartItems.length === 0) return;

    const cleanName = sanitizeName(customerName);
    const cleanPhone = sanitizePhone(customerPhone);
    const cleanAddress = sanitizeAddress(deliveryAddress);

    if (!cleanPhone || !isValidBangladeshPhone(cleanPhone)) {
      setValidationError(
        lang === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নাম্বার লিখুন (যেমন: 01812345678)'
          : 'Please enter a valid 11-digit Bangladesh phone number (e.g. 01812345678)'
      );
      return;
    }

    // Enforce OTP verification before order submission (anti-spam & COD protection)
    if (!isPhoneVerified) {
      setValidationError(
        lang === 'bn'
          ? '⚠️ অর্ডার নিশ্চিত করার পূর্বে আপনার ১১-ডিজিটের মোবাইল নম্বরটি ওটিপি কোড দিয়ে যাচাই করুন।'
          : '⚠️ Please verify your phone number via OTP code before confirming the order.'
      );
      if (!otpSent) {
        handleSendOtp();
      }
      return;
    }

    setIsSubmittingOrder(true);
    const tracking = 'JDM-ORD-' + Math.floor(100000 + Math.random() * 900000);
    setOrderTrackingId(tracking);

    // Future-proofed order payload with Beta specifications (0% commission, COD, OTP verified)
    const orderPayload = {
      id: tracking,
      customerName: cleanName || (lang === 'bn' ? 'সম্মানিত ক্রেতা' : 'Valued Customer'),
      customerPhone: cleanPhone,
      deliveryAddress: cleanAddress || (lang === 'bn' ? 'খাগড়াছড়ি সদর' : 'Khagrachhari Sadar'),
      items: cartItems.map(item => ({
        productId: item.product.id,
        nameBn: item.product.nameBn,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image
      })),
      totalAmount,
      paymentMethod,
      status: 'Pending' as const,
      date: new Date().toISOString().split('T')[0],
      // Future-Proofing for Commission & Payment Gateways (Beta Phase)
      commissionRate: 0,
      commissionAmount: 0,
      commissionStatus: 'exempt' as const,
      paymentStatus: (paymentMethod === 'COD' ? 'cod_unpaid' : 'pending') as 'cod_unpaid' | 'pending',
      gatewayName: null,
      gatewayTransactionId: null,
      gatewayPayload: null,
      isBetaPhase: true,
      orderChannel: (paymentMethod === 'Direct_Contact' ? 'Direct_Contact' : 'COD') as 'Direct_Contact' | 'COD',
      customerOtpVerified: true,
      customerVerificationCode: otpCode || 'VERIFIED',
      notes: 'Beta Phase COD Order (0% Commission, Verified Mobile OTP)'
    };

    // 1. Save to local React DataContext for Admin Panel
    addOrder(orderPayload);

    // 2. Submit to Supabase PostgreSQL orders table via databaseService
    await databaseService.submitOrderToDatabase(orderPayload);

    // 3. Dispatch to backend hyperlocal delivery dispatch server
    try {
      const res = await fetch('/api/food-grocery-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: cleanName || 'সম্মানিত ক্রেতা',
          customerPhone: cleanPhone,
          deliveryAddress: cleanAddress,
          district: 'Khagrachhari',
          upazila: 'Khagrachhari Sadar',
          items: cartItems.map(c => ({ name: c.product.nameBn, qty: c.quantity, price: c.product.price })),
          totalPrice: totalAmount,
          paymentMethod,
          isBetaPhase: true,
          customerOtpVerified: true,
          orderType: 'Organic Grocery Delivery'
        })
      });
      const data = await res.json();
      if (data.success && data.order?.assignedRider) {
        setAssignedRider(data.order.assignedRider);
      } else {
        setAssignedRider({ driverName: 'সুনীল চাকমা (খাগড়াছড়ি এক্সপ্রেস)', phone: '01812345678' });
      }
    } catch {
      setAssignedRider({ driverName: 'সুনীল চাকমা (খাগড়াছড়ি এক্সপ্রেস)', phone: '01812345678' });
    } finally {
      setIsSubmittingOrder(false);
      setIsOrderPlaced(true);
    }
  };

  const handleFinish = () => {
    onClearCart();
    setIsOrderPlaced(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-modal-title"
    >
      <div 
        className="bg-white w-full max-w-md max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#2EAA26] text-white p-4 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 id="cart-drawer-modal-title" className="text-sm font-black leading-tight">
                {t.cartTitle}
              </h3>
              <span className="text-[11px] text-green-100 font-medium">
                {lang === 'bn' ? `${cartItems.length}টি পণ্য কার্টে যুক্ত` : `${cartItems.length} items in cart`}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close cart"
            className="p-1.5 bg-black/20 hover:bg-black/30 rounded-xl text-white transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Confirmed Screen */}
        {isOrderPlaced ? (
          <div className="p-5 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-900">
                {t.orderSuccessMsg}
              </h3>
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <span className="text-xs text-gray-600">
                  {lang === 'bn' ? 'অর্ডার ট্র্যাকিং কোড:' : 'Order Tracking ID:'}
                </span>
                <span className="font-mono font-black text-sm text-[#2EAA26]">
                  #{orderTrackingId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(orderTrackingId);
                    }
                    setCopiedTrackId(true);
                    setTimeout(() => setCopiedTrackId(false), 2000);
                  }}
                  className="p-1 text-gray-500 hover:text-emerald-700 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer active:scale-95"
                  title="ট্র্যাকিং আইডি কপি করুন"
                >
                  {copiedTrackId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Beta Phase Notice in Confirmation */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-left flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-black block">{lang === 'bn' ? 'বেটা ফেজ ক্যাশ অন ডেলিভারি (COD)' : 'Beta Phase Cash on Delivery'}</span>
                {lang === 'bn' 
                  ? 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। কোনো প্রকার অগ্রিম অর্থ প্রদানের প্রয়োজন নেই।'
                  : 'Pay upon delivery. No advance payment required.'}
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between text-gray-700">
                <span>{lang === 'bn' ? 'গ্রাহকের নাম:' : 'Customer Name:'}</span>
                <span className="font-bold text-gray-900">{customerName}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>{lang === 'bn' ? 'মোবাইল:' : 'Mobile:'}</span>
                <span className="font-bold text-gray-900">{customerPhone} (যাচাইকৃত ✓)</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>{lang === 'bn' ? 'ঠিকানা:' : 'Address:'}</span>
                <span className="font-bold text-gray-900 truncate max-w-[200px]">{deliveryAddress}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>{lang === 'bn' ? 'পেমেন্ট মেথড:' : 'Payment Method:'}</span>
                <span className="font-black text-emerald-800">
                  {paymentMethod === 'COD' ? (lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery') : (lang === 'bn' ? 'সরাসরি যোগাযোগ' : 'Direct Contact')}
                </span>
              </div>
              <div className="flex justify-between text-gray-700 border-t border-emerald-200/80 pt-1.5">
                <span className="font-black text-gray-900 text-sm">{lang === 'bn' ? 'মোট প্রদেয়:' : 'Total Amount:'}</span>
                <span className="font-black text-emerald-800 text-base">৳ {totalAmount.toLocaleString('bn-BD')}</span>
              </div>
            </div>

            {/* Local Rider / Delivery Direct Contact Buttons */}
            {assignedRider && (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#2EAA26]" />
                    {lang === 'bn' ? 'নিযুক্ত লোকাল রাইডার' : 'Assigned Local Rider'}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">{assignedRider.driverName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${assignedRider.phone}`}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'সরাসরি কল' : 'Call Rider'}</span>
                  </a>
                  <a
                    href={`https://wa.me/88${assignedRider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`হ্যালো, আমি ঝাদিমাদি ডটকম থেকে অর্ডার #${orderTrackingId} বিষয়ে যোগাযোগ করছি। মোট ৳${totalAmount} (COD)`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-green-600 text-white py-2 px-3 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-[#2EAA26] hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'হোম পেজে ফিরে যান' : 'Back to Home'}
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center space-y-3.5 my-auto">
            <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-gray-700">
              {t.emptyCartText}
            </h4>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#2EAA26] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 active:scale-95 cursor-pointer transition-all"
            >
              {t.browseProducts}
            </button>
          </div>
        ) : (
          /* Cart items and Checkout Form */
          <div className="overflow-y-auto no-scrollbar p-3.5 space-y-3 flex-1">
            {/* Beta Phase Notice Banner */}
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-2.5 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <span className="font-black block">{lang === 'bn' ? 'ঝাদিমাদি বেটা ফেজ — ০% প্ল্যাটফর্ম ফি' : 'Jhadimadi Beta Phase — 0% Platform Fee'}</span>
                {lang === 'bn' 
                  ? 'বর্তমানে শুধুমাত্র ক্যাশ অন ডেলিভারি (COD) এবং সরাসরি যোগাযোগ প্রযোজ্য। স্প্যাম রোধে ফোন ওটিপি যাচাই বাধ্যতামূলক।'
                  : 'Currently operating via Cash on Delivery (COD) & Direct Contact. Phone OTP verification is required to prevent spam.'}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div 
                  key={item.product.id} 
                  className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-2xl border border-gray-200/80"
                >
                  <img 
                    src={getProductPublicUrl(item.product.image)} 
                    alt={item.product.nameBn} 
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = NO_IMAGE_AVAILABLE_ICON;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-black text-gray-900 truncate">
                      {lang === 'bn' ? item.product.nameBn : (item.product.nameEn || item.product.nameBn)}
                    </h5>
                    <span className="text-[10.5px] text-gray-500 block">
                      {item.product.unit} • {item.product.origin}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      ৳ {item.product.price} × {item.quantity} = ৳ {(item.product.price * item.quantity).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center bg-white rounded-xl border border-gray-300 p-0.5 shrink-0 shadow-xs">
                    <button 
                      onClick={() => onUpdateQty(item.product.id, -1)}
                      aria-label="Decrease quantity"
                      className="w-5 h-5 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 font-bold cursor-pointer active:scale-95"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-black text-gray-900">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => onUpdateQty(item.product.id, 1)}
                      aria-label="Increase quantity"
                      className="w-5 h-5 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 font-bold cursor-pointer active:scale-95"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button 
                    onClick={() => onRemoveItem(item.product.id)}
                    aria-label="Remove item"
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-xl shrink-0 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Clear Cart Button */}
            <div className="flex justify-end">
              <button 
                onClick={onClearCart}
                className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                {lang === 'bn' ? 'কার্ট খালি করুন' : 'Clear Cart'}
              </button>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handlePlaceOrder} className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-2.5 text-left">
              <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-200 pb-2">
                <MapPin className="w-3.5 h-3.5 text-[#2EAA26]" />
                {lang === 'bn' ? 'ডেলিভারি ও যাচাইকরণ তথ্য' : 'Delivery & Verification Info'}
              </h4>

              {validationError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-2">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700">
                    {lang === 'bn' ? 'আপনার পুরো নাম' : 'Full Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'bn' ? 'যেমন: অনিক মারমা / মো: তানভীর' : 'e.g. Anik Marma'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2EAA26]"
                  />
                </div>

                {/* Phone Number with OTP Verification Flow */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700">
                      {lang === 'bn' ? 'মোবাইল নাম্বার (১১ ডিজিট)' : 'Phone Number (11 digits)'} <span className="text-red-500">*</span>
                    </label>
                    {isPhoneVerified ? (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700">
                        {lang === 'bn' ? 'ওটিপি যাচাই আবশ্যক' : 'OTP verification required'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={customerPhone}
                      disabled={isPhoneVerified}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={`flex-1 bg-white border rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none ${
                        isPhoneVerified 
                          ? 'border-emerald-500 bg-emerald-50/50 font-bold' 
                          : 'border-gray-300 focus:ring-2 focus:ring-[#2EAA26]'
                      }`}
                    />

                    {!isPhoneVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isOtpSending || otpCountdown > 0 || customerPhone.replace(/[^0-9]/g, '').length !== 11}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          customerPhone.replace(/[^0-9]/g, '').length === 11 && otpCountdown === 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isOtpSending 
                          ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') 
                          : otpCountdown > 0 
                            ? `${otpCountdown}s` 
                            : (lang === 'bn' ? 'ওটিপি পাঠান' : 'Send OTP')}
                      </button>
                    )}
                  </div>

                  {/* OTP Entry Box */}
                  {!isPhoneVerified && otpSent && (
                    <div className="mt-2 p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-900 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-emerald-700" />
                          {lang === 'bn' ? '৪ ডিজিটের ওটিপি কোড দিন:' : 'Enter 4-digit OTP Code:'}
                        </span>
                        {otpCountdown > 0 && (
                          <span className="text-[11px] text-gray-500">{otpCountdown}s পর পুনরায় পাঠানো যাবে</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-28 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-sm font-black text-center tracking-widest text-emerald-900 focus:outline-none focus:ring-2 focus:ring-[#2EAA26]"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isOtpVerifying || otpCode.length < 4}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            otpCode.length >= 4 
                              ? 'bg-[#2EAA26] hover:bg-emerald-700 text-white shadow-xs active:scale-95' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isOtpVerifying ? (lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Verifying...') : (lang === 'bn' ? 'যাচাই করুন' : 'Verify')}
                        </button>
                      </div>
                    </div>
                  )}

                  {otpMessage && (
                    <p className={`text-[11px] mt-1 font-bold ${isPhoneVerified ? 'text-emerald-700' : 'text-gray-600'}`}>
                      {otpMessage}
                    </p>
                  )}
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700">
                    {lang === 'bn' ? 'পূর্ণ ঠিকানা (জেলা, থানা ও পাড়া)' : 'Full Address (District, Thana & Para)'} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={lang === 'bn' ? 'যেমন: পানখাইয়াপাড়া, খাগড়াছড়ি সদর, খাগড়াছড়ি' : 'e.g. Pankhaiyapara, Khagrachhari Sadar'}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2EAA26] resize-none"
                  />
                </div>

                {/* Payment & Channel Selection (Beta Phase: COD & Direct Contact Active; Gateways Prepared) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700">
                      {lang === 'bn' ? 'পেমেন্ট ও অর্ডার চ্যানেল (বেটা পর্যায়)' : 'Payment & Order Channel (Beta)'}
                    </label>
                    <span className="text-[10px] font-black text-emerald-700">০% কমিশন</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === 'COD'
                          ? 'border-[#2EAA26] bg-emerald-50 text-emerald-800 ring-1 ring-[#2EAA26]'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 font-bold">
                        <Truck className="w-3 h-3 text-emerald-600" />
                        {lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
                      </div>
                      <span className="text-[10px] text-gray-500 block font-normal mt-0.5">পণ্য পেয়ে মূল্য পরিশোধ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Direct_Contact')}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === 'Direct_Contact'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 font-bold">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        {lang === 'bn' ? 'সরাসরি যোগাযোগ' : 'Direct Contact'}
                      </div>
                      <span className="text-[10px] text-gray-500 block font-normal mt-0.5">WhatsApp / ফোনে কথা</span>
                    </button>
                  </div>

                  {/* Future Gateway Integration Plug-in Notice */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 bg-gray-100/80 px-2.5 py-1.5 rounded-xl">
                    <span>💳 {lang === 'bn' ? 'বিকাশ / নগদ / রকেট গেটওয়ে:' : 'bKash / Nagad Gateway:'}</span>
                    <span className="font-bold text-amber-700">{lang === 'bn' ? 'পরবর্তী সংস্করণে যুক্ত হবে' : 'Coming next release'}</span>
                  </div>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="border-t border-gray-200 pt-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>{t.subtotal}</span>
                  <span className="font-bold text-gray-900">৳ {subtotal.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t.deliveryFee}</span>
                  <span className="font-bold text-emerald-700">
                    {deliveryCharge === 0 ? (lang === 'bn' ? 'ফ্রি ডেলিভারি (৳২০০০+ অর্ডারে)' : 'Free Delivery (orders 2000+)') : `৳ ${deliveryCharge}`}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between font-black text-sm text-gray-900">
                  <span>{t.totalAmount}</span>
                  <span className="text-[#2EAA26] text-base font-black">৳ {totalAmount.toLocaleString('bn-BD')}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className={`w-full mt-2 py-3 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isPhoneVerified 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95' 
                    : 'bg-[#2EAA26] hover:bg-emerald-700 text-white active:scale-95'
                }`}
              >
                {isSubmittingOrder ? (
                  <span>{lang === 'bn' ? 'অর্ডার সাবমিট হচ্ছে...' : 'Submitting Order...'}</span>
                ) : !isPhoneVerified ? (
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    {lang === 'bn' ? 'প্রথমে মোবাইল ওটিপি যাচাই করুন' : 'Verify Mobile OTP First'}
                  </span>
                ) : (
                  <>
                    <span>{lang === 'bn' ? `অর্ডার নিশ্চিত করুন (৳ ${totalAmount.toLocaleString('bn-BD')})` : `Confirm Order (৳ ${totalAmount.toLocaleString('bn-BD')})`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
