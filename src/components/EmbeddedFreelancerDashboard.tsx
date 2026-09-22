import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  Star, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Bell, 
  ArrowLeft, 
  Wallet, 
  MapPin, 
  Share2, 
  Settings, 
  Phone, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { RegisteredProfessional } from './ProfessionalRegistrationWizard';
import { Language } from '../utils/translations';
import { getProviderWalletSummary, EscrowTransaction } from '../utils/escrowService';

interface EmbeddedFreelancerDashboardProps {
  provider?: RegisteredProfessional;
  professional?: RegisteredProfessional;
  onBack: () => void;
  onEditPortfolio: () => void;
  onViewPublicProfile?: () => void;
  lang: Language;
}

export const EmbeddedFreelancerDashboard: React.FC<EmbeddedFreelancerDashboardProps> = ({
  provider: initialProvider,
  professional,
  onBack,
  onEditPortfolio,
  onViewPublicProfile = () => {},
  lang
}) => {
  const provider = initialProvider || professional || {} as RegisteredProfessional;
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'wallet'>('overview');
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutMethod, setCashoutMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [cashoutNumber, setCashoutNumber] = useState('');
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  const wallet = getProviderWalletSummary(String(provider.id), provider.uniqueId);

  interface BookingRequestItem {
    id: string;
    clientName: string;
    clientPhone: string;
    serviceTitle: string;
    amount: number;
    fee5Pct: number;
    net95Pct: number;
    date: string;
    location: string;
    status: string;
  }

  const [bookingRequests, setBookingRequests] = useState<BookingRequestItem[]>([]);

  const handleAcceptBooking = (reqId: string) => {
    setBookingRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'accepted' } : r));
  };

  const handleCashoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCashoutSuccess(true);
    setTimeout(() => {
      setCashoutSuccess(false);
      setShowCashoutModal(false);
      setCashoutAmount('');
    }, 2000);
  };

  return (
    <div className="bg-slate-50 min-h-full rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs relative pb-10 animate-fadeIn">
      
      {/* 1. Header Bar */}
      <div className="bg-white sticky top-0 z-20 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#2EAA26]" />
          <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
            ★
          </div>
          <span className="font-extrabold text-xs text-slate-900 font-mono">
            {provider.uniqueId || 'S-KHG-001'}
          </span>
        </div>

        <button
          type="button"
          onClick={onViewPublicProfile}
          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>পাবলিক ভিউ</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3.5 space-y-3.5">
        
        {/* Profile Card Summary */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={provider.img} 
              alt={provider.name} 
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#2EAA26] bg-slate-100 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-black text-slate-900 truncate">{provider.name}</h2>
                <ShieldCheck className="w-4 h-4 text-[#2EAA26] shrink-0" />
              </div>
              <p className="text-[9.5px] text-slate-600 line-clamp-1 mt-0.5">{provider.professionalHeadline}</p>
              <div className="flex items-center gap-1 text-[8.5px] text-slate-500 mt-1">
                <MapPin className="w-3 h-3 text-[#2EAA26]" />
                <span>{provider.area}, {provider.district}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onEditPortfolio}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer shrink-0"
            title="পোর্টফোলিও এডিট করুন"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-xl gap-1 text-[9.5px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'
            }`}
          >
            📊 মেট্রিক্স
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
              activeTab === 'bookings' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'
            }`}
          >
            🔔 বুকিং রিকোয়েস্ট ({bookingRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
              activeTab === 'wallet' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'
            }`}
          >
            💰 এসক্রো ও আয় (৯৫%)
          </button>
        </div>

        {/* TAB 1: METRICS OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase">মোট উপার্জন (নেট ৯৫%)</span>
                <div className="text-base font-black text-emerald-700 font-mono">৳১২,৪৫০</div>
                <span className="text-[7.5px] text-slate-500 font-bold">৫% প্ল্যাটফর্ম ফি কর্তনের পর</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase">সম্পন্ন কাজ</span>
                <div className="text-base font-black text-slate-900 font-mono">{provider.completedJobs || 28}টি</div>
                <span className="text-[7.5px] text-emerald-600 font-bold">১০০% সফল জব ডেলিভারি</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase">লাইভ রেটিং</span>
                <div className="text-base font-black text-amber-500 font-mono flex items-center gap-1">
                  <span>★ {provider.rating || 4.9}</span>
                </div>
                <span className="text-[7.5px] text-slate-500">২২টি যাচাইকৃত রিভিউ</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase">এনআইডি স্ট্যাটাস</span>
                <div className="text-xs font-black text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ভেরিফাইড</span>
                </div>
                <span className="text-[7.5px] text-slate-500 font-mono">ID: {provider.uniqueId}</span>
              </div>
            </div>

            {/* Skills & Bio Snapshot */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#2EAA26]" />
                  <span>আপনার সক্রিয় স্কিলস ম্যাট্রিক্স ({provider.selectedSkillsList?.length || 4}টি)</span>
                </h4>
                <button type="button" onClick={onEditPortfolio} className="text-[8.5px] text-[#2EAA26] font-bold hover:underline">
                  সম্পাদনা
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {provider.selectedSkillsList?.map((sk, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-800 text-[8.5px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKING ALERTS */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>ক্লায়েন্ট বুকিং অ্যালার্ট ও এআই নোটিফিকেশন</span>
              </h4>
            </div>

            {bookingRequests.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <h5 className="text-xs font-bold text-slate-700">কোনো নতুন বুকিং রিকোয়েস্ট নেই</h5>
                <p className="text-[10.5px] text-slate-500">নতুন ক্লায়েন্ট সার্ভিস রিকোয়েস্ট পাঠালে এখানে তাৎক্ষণিক নোটিফিকেশন দেখতে পাবেন।</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bookingRequests.map((req) => (
                  <div key={req.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-[10.5px] font-black text-slate-900">{req.serviceTitle}</h5>
                        <p className="text-[8.5px] text-slate-500 mt-0.5">ক্লায়েন্ট: {req.clientName} • {req.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-700">৳{req.amount}</div>
                        <div className="text-[7.5px] text-slate-400">নেট: ৳{req.net95Pct}</div>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[8px] text-slate-500 font-mono">{req.date}</span>
                      {req.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handleAcceptBooking(req.id)}
                          className="px-3 py-1 bg-[#2EAA26] hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black shadow-xs cursor-pointer"
                        >
                          কাজ গ্রহণ করুন (Accept)
                        </button>
                      ) : (
                        <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#2EAA26]" />
                          <span>গৃহীত ও এসক্রো সিকিউরড</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WALLET & 5% COMMISSION ESCROW */}
        {activeTab === 'wallet' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">উপলব্ধ ব্যালেন্স (নেট ৯৫%)</span>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">৳৬,৮৪০.০০</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCashoutModal(true)}
                  className="px-3 py-1.5 bg-[#2EAA26] hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>ক্যাশআউট</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700 text-[9px]">
                <div>
                  <span className="text-slate-400">মোট সার্ভিস ফি:</span>
                  <span className="font-bold text-white ml-1">৳৭,২০০</span>
                </div>
                <div>
                  <span className="text-slate-400">৫% প্ল্যাটফর্ম ফি:</span>
                  <span className="font-bold text-amber-300 ml-1">-৳৩৬০</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-[9px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2EAA26]" />
                <span>ঝাদিমাদি ৫% এসক্রো সিকিউরিটি পলিসি</span>
              </div>
              <p className="leading-relaxed">
                আপনার ক্লায়েন্টের পেমেন্ট সুরক্ষিতভাবে ঝাদিমাদি গেটওয়েতে জমা থাকে। কাজ সফলভাবে সম্পন্ন হওয়ার সাথে সাথেই ৯৫% ব্যালেন্স আপনার ওয়ালেটে আনলক হয়ে যায়।
              </p>
            </div>
          </div>
        )}

      </div>

      {/* CASHOUT MODAL */}
      {showCashoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-xs rounded-3xl p-4 space-y-3 animate-scaleUp shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#2EAA26]" />
                <span>ব্যালেন্স ক্যাশআউট রিকোয়েস্ট</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCashoutModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            {cashoutSuccess ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#2EAA26] mx-auto animate-bounce" />
                <h4 className="text-xs font-black text-slate-900">ক্যাশআউট রিকোয়েস্ট সফল!</h4>
                <p className="text-[9px] text-slate-500">আপনার {cashoutMethod} নম্বরে ২৪ ঘণ্টার মধ্যে টাকা পাঠিয়ে দেওয়া হবে।</p>
              </div>
            ) : (
              <form onSubmit={handleCashoutSubmit} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">উত্তোলন পরিমাণ (সর্বোচ্চ ৳৬,৮৪০)</label>
                  <input
                    type="number"
                    required
                    max={6840}
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    placeholder="৳ 2000"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">পেমেন্ট মেথড</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCashoutMethod('bKash')}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition ${
                        cashoutMethod === 'bKash' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      বিকাশ (bKash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashoutMethod('Nagad')}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition ${
                        cashoutMethod === 'Nagad' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      নগদ (Nagad)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">{cashoutMethod} অ্যাকাউন্ট নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={cashoutNumber}
                    onChange={(e) => setCashoutNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#2EAA26] hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition"
                  >
                    ক্যাশআউট কনফার্ম করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
