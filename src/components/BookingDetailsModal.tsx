import React, { useState } from 'react';
import { Booking, Language } from '../types';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  X, 
  Send, 
  Navigation,
  Lock,
  Unlock,
  CheckCircle2
} from 'lucide-react';

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  lang: Language;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'map' | 'chat'>('details');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'provider', text: 'শুভ দিন! আমি আপনার কাজের ঠিকানার দিকে রওনা হয়েছি।' },
    { sender: 'user', text: 'ধন্যবাদ। আমি রাঙামাটি সদর ৩ নং ওয়ার্ডে আছি।' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  if (!booking) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setChatMessages([...chatMessages, { sender: 'user', text: inputMsg }]);
    setInputMsg('');
    setTimeout(() => {
      setChatMessages(msgs => [
        ...msgs,
        { sender: 'provider', text: 'ঠিক আছে, আমি ২ মিনিটের মধ্যে পৌঁছাচ্ছি।' }
      ]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {booking.status}
              </span>
              <h3 className="font-bold text-sm text-white">
                {lang === 'bn' ? booking.serviceTitleBn : booking.serviceTitleEn}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">বুকিং আইডি: #{booking.id}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
              activeTab === 'details' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'বিস্তারিত তথ্য' : 'Details'}
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center space-x-1 ${
              activeTab === 'map' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'লাইভ গুগল ম্যাপ' : 'Live Map'}</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center space-x-1 ${
              activeTab === 'chat' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ইন-অ্যাপ চ্যাট' : 'In-App Chat'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto grow space-y-4">
          {activeTab === 'details' && (
            <>
              {/* Provider Profile */}
              {booking.provider && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img 
                        src={booking.provider.avatar} 
                        alt={booking.provider.name} 
                        className="w-12 h-12 rounded-full object-cover border border-emerald-500"
                      />
                      {booking.provider.blueTickActive && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute -bottom-1 -right-1 bg-slate-950 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>{booking.provider.name}</span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded">
                          NID ভেরিফাইড
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {lang === 'bn' ? booking.provider.categoryBn : booking.provider.categoryEn}
                      </p>
                      <p className="text-[10px] text-amber-400 font-bold">
                        ★ {booking.provider.rating} ({booking.provider.jobsCompleted} কাজ সম্পন্ন)
                      </p>
                    </div>
                  </div>

                  {/* Masked Call Simulator */}
                  <div className="text-right space-y-1">
                    <button
                      onClick={() => setIsCalling(!isCalling)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-md shadow-emerald-950"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{isCalling ? 'কলিং...' : 'কল করুন'}</span>
                    </button>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400 justify-end">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>{booking.provider.phoneHidden}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Call Overlay simulation */}
              {isCalling && (
                <div className="bg-emerald-950/80 border border-emerald-700/60 p-3 rounded-xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-2 text-xs text-emerald-200">
                    <Phone className="w-4 h-4 text-emerald-400 animate-bounce" />
                    <span>গোপনীয় নম্বরে কল সংযুক্ত হচ্ছে... (+880 17XX-XXX892)</span>
                  </div>
                  <button 
                    onClick={() => setIsCalling(false)}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded cursor-pointer"
                  >
                    কল কাটুন
                  </button>
                </div>
              )}

              {/* Privacy Shield Info */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-emerald-300">ঝাদিমাদি প্রাইভেসি ও ফোন নম্বর প্রোটোকল:</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    বুকিং চলাকালীন কাস্টমার ও সেবাদাতা উভয় পক্ষের আসল ফোন নম্বর নিরাপদ রাখা হয়। ইন-অ্যাপ ভয়েস কল এবং চ্যাটের মাধ্যমে যোগাযোগ সুরক্ষিত।
                  </p>
                </div>
              </div>

              {/* 10% Escrow & Commission Payout Breakdown */}
              <div className="bg-emerald-950/70 p-3.5 rounded-xl border border-emerald-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#00A86B]" />
                    <span className="font-extrabold text-xs text-emerald-300">
                      নিরাপদ এসক্রো ও ১০% প্ল্যাটফর্ম কমিশন হিসাব:
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    booking.escrowStatus === 'ReleasedToWorker' 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {booking.escrowStatus === 'ReleasedToWorker' ? '✓ ওয়ালেটে রিলিজড' : '🔒 এসক্রোতে সুরক্ষিত'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px]">গ্রাহক পরিশোধিত:</span>
                    <strong className="text-white font-black">৳{booking.clientPaidAmount || booking.totalAmount}</strong>
                  </div>
                  <div className="border-x border-slate-800 px-1">
                    <span className="text-amber-400 block text-[9px]">১০% প্ল্যাটফর্ম ফি:</span>
                    <strong className="text-amber-300 font-black">
                      -৳{booking.platformCommission || Math.round((booking.clientPaidAmount || booking.totalAmount) * 0.1)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-[9px]">৯০% কর্মীর নিট আয়:</span>
                    <strong className="text-emerald-300 font-black">
                      +৳{booking.workerNetEarning || Math.round((booking.clientPaidAmount || booking.totalAmount) * 0.9)}
                    </strong>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 leading-tight">
                  কাস্টমার সন্তোষজনকভাবে কাজ বুঝে নেওয়ার পর কর্মীর ব্যালেন্সে তাৎক্ষণিক ৳{booking.workerNetEarning || Math.round((booking.clientPaidAmount || booking.totalAmount) * 0.9)} টাকা জমা হবে।
                </p>
              </div>

              {/* Order summary info */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">লোকেশন:</span>
                  <span className="font-semibold text-white">{booking.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">কাজের মূল্য (Service Fee):</span>
                  <span className="font-semibold text-emerald-400">৳{booking.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">কন্টাক্ট আনলক চার্জ (সেবাদাতার থেকে):</span>
                  <span className="font-semibold text-amber-400">৳{booking.contactUnlockFee}</span>
                </div>
              </div>
            </>
          )}

          {/* Map Tab Simulator */}
          {activeTab === 'map' && (
            <div className="space-y-3">
              <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                {/* Visual Google Map Mockup SVG */}
                <svg className="w-full h-full object-cover opacity-60" viewBox="0 0 600 300" fill="none">
                  <path d="M0 100 Q 150 50, 300 150 T 600 200" stroke="#334155" strokeWidth="12" />
                  <path d="M100 0 Q 200 200, 400 100 T 500 300" stroke="#1e293b" strokeWidth="8" />
                  <circle cx="200" cy="120" r="12" fill="#10b981" fillOpacity="0.3" />
                  <circle cx="200" cy="120" r="6" fill="#10b981" />
                  <circle cx="420" cy="180" r="12" fill="#ef4444" fillOpacity="0.3" />
                  <circle cx="420" cy="180" r="6" fill="#ef4444" />
                  <line x1="200" y1="120" x2="420" y2="180" stroke="#10b981" strokeWidth="3" strokeDasharray="6 6" />
                </svg>
                <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] backdrop-blur-md">
                  <span className="text-slate-400">দূরত্ব: </span>
                  <span className="font-bold text-emerald-400">১.২ কিমি</span>
                  <span className="text-slate-400 ml-2">আনুমানিক সময়: </span>
                  <span className="font-bold text-teal-300">৮ মিনিট</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-emerald-600 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-emerald-400 shadow-lg">
                  Google Maps PostGIS Routing
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">
                পোস্টজিআইএস (PostGIS) লোকেশন ইঞ্জিন দ্বারা সেবাদাতার লাইভ ট্র্যাকিং।
              </p>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-3 flex flex-col h-72 justify-between">
              <div className="space-y-2 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800 grow">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="মেসেজ লিখুন..."
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  className="grow bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
