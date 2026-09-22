import React, { useState } from 'react';
import { 
  X, ShieldCheck, CheckCircle2, Award, Zap, Phone, Lock, 
  Copy, Check, AlertCircle, CreditCard, Sparkles 
} from 'lucide-react';
import { UserProfile, Language } from '../types';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onPaymentSuccess: (trxId: string, method: 'bKash' | 'Nagad' | 'AdminApproval') => void;
  lang: Language;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPaymentSuccess,
  lang,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'AdminApproval'>('bKash');
  const [phoneNo, setPhoneNo] = useState(currentUser?.phone || '');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const bKashNumber = import.meta.env.VITE_MERCHANT_BKASH || '018XXXXXXXX';
  const nagadNumber = import.meta.env.VITE_MERCHANT_NAGAD || '018XXXXXXXX';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod !== 'AdminApproval' && !trxId.trim()) {
      alert('অনুগ্রহ করে পেমেন্টের ট্রানজেকশন আইডি (TrxID) ইনপুট দিন।');
      return;
    }

    const finalTrx = trxId || 'TRX_' + Math.floor(100000 + Math.random() * 900000);

    try {
      const res = await fetch('/api/membership/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNo || currentUser?.phone || '',
          paymentMethod,
          trxId: finalTrx,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || 'পেমেন্ট জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে সঠিক TrxID দিন।');
        return;
      }
    } catch (err) {
      console.log('Membership sync fallback used');
    }

    onPaymentSuccess(finalTrx, paymentMethod);
    alert('🎉 ধন্যবাদ! আপনার ৳১০০ বার্ষিক সদস্যপদ ফি ও TrxID সফলভাবে জমা হয়েছে।\nভেরিফিকেশন সম্পন্ন হলে প্রোফাইলে "ভেরিফাইড প্রো পার্টনার [✓]" ব্লু-টিক অ্যাক্টিভ হবে!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 border-2 border-[#00A86B]/50 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-800 my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#00A86B]/20 text-[#00A86B] rounded-xl border border-[#00A86B]/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                বার্ষিক মেম্বারশিপ ফি (৳১০০)
              </h3>
              <p className="text-[10px] text-emerald-400 font-bold">
                ✓ ভেরিফাইড প্রো পার্টনার [✓] ব্যাজ অ্যাক্টিভেশন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1 bg-[#F8FAFC]">
          
          {/* Pro Benefits Badge Card */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-3.5 space-y-2 border border-emerald-500/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[#FF6B35] text-white text-[9px] font-black uppercase">
                ১ বছরের সদস্যপদ
              </span>
              <span className="text-xl font-black text-[#00A86B]">৳১০০ <span className="text-xs text-slate-300 font-normal">/ বছর</span></span>
            </div>

            <h4 className="font-bold text-xs text-emerald-300">প্রো পার্টনার মেম্বারশিপ সুবিধাসমূহ:</h4>
            
            <ul className="text-[10px] text-slate-200 space-y-1">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] shrink-0 mt-0.5" />
                <span>অনলিমিটেড পণ্য (Buy/Sell) ও সার্ভিস লিস্টিং পোস্ট প্রকাশের সুবিধা</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] shrink-0 mt-0.5" />
                <span>প্রোফাইলে <strong>'Verified Pro Partner [✓]'</strong> গোল্ডেন ব্লু ভেরিফাইড ব্যাজ</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] shrink-0 mt-0.5" />
                <span>কাস্টমারদের থেকে সরাসরি মোবাইল কল ও চ্যাট রিকোয়েস্ট গ্রহণ</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] shrink-0 mt-0.5" />
                <span>গুগল প্লে-স্টোর ইউজিচি সেফটি ও অ্যাডমিন মডারেশন ট্রাস্ট সার্টিফিকেশন</span>
              </li>
            </ul>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
              পেমেন্ট মাধ্যম নির্বাচন করুন:
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('bKash')}
                className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                  paymentMethod === 'bKash'
                    ? 'bg-pink-50 border-pink-500 text-pink-700 font-extrabold ring-1 ring-pink-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-black">বিকাশ</span>
                <span className="text-[9px] text-slate-400">bKash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Nagad')}
                className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                  paymentMethod === 'Nagad'
                    ? 'bg-orange-50 border-orange-500 text-orange-700 font-extrabold ring-1 ring-orange-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-black">নগদ</span>
                <span className="text-[9px] text-slate-400">Nagad</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('AdminApproval')}
                className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                  paymentMethod === 'AdminApproval'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-extrabold ring-1 ring-emerald-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-black">⚡ ইনস্ট্যান্ট</span>
                <span className="text-[9px] text-slate-400">Admin Demo</span>
              </button>
            </div>
          </div>

          {/* Payment Instructions Card */}
          {paymentMethod !== 'AdminApproval' ? (
            <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  {paymentMethod === 'bKash' ? 'বিকাশ সেন্ড মানি (Send Money):' : 'নগদ ক্যাশ-আউট / সেন্ড মানি:'}
                </span>
                <span className="text-[10px] text-rose-600 font-extrabold">৳১০০ টাকা</span>
              </div>

              <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl border border-slate-200">
                <span className="font-mono font-black text-sm text-slate-800">
                  {paymentMethod === 'bKash' ? bKashNumber : nagadNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentMethod === 'bKash' ? bKashNumber : nagadNumber)}
                  className="px-2 py-1 bg-[#00A86B] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'কপি হয়েছে' : 'নম্বর কপি'}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                উপরের নম্বরে ৳১০০ সেন্ড মানি করে নিচে আপনার ওয়ালেট নম্বর ও TrxID দিন।
              </p>

              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    আপনার {paymentMethod === 'bKash' ? 'বিকাশ' : 'নগদ'} মোবাইল নম্বর:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01711223344"
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    ট্রানজেকশন আইডি (TrxID):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRX9021845"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-black text-emerald-800">
                <Sparkles className="w-4 h-4 text-[#00A86B]" />
                <span>অ্যাডমিন ডেমো মোড (Instant Verification)</span>
              </div>
              <p className="text-[10px] text-emerald-700 leading-snug">
                পরীক্ষার জন্য আপনি কোনো ফি ছাড়াই এখনই আপনার একাউন্ট 'ভেরিফাইড প্রো পার্টনার [✓]' হিসেবে সক্রিয় করতে পারবেন।
              </p>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3 bg-[#00A86B] hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {paymentMethod === 'AdminApproval' 
                ? '⚡ এখনই ভেরিফাইড প্রো ব্যাজ অ্যাক্টিভ করুন' 
                : `৳১০০ পেমেন্ট নিশ্চিত করুন (${paymentMethod})`}
            </span>
          </button>

        </form>

      </div>
    </div>
  );
};
