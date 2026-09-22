import React, { useState } from 'react';
import { District, Language, WalletState, PartnerVerification } from '../types';
import { 
  UserCheck, 
  ShieldCheck, 
  Wallet, 
  CreditCard, 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Camera,
  Upload,
  Phone,
  MapPin,
  Sparkles,
  DollarSign,
  Briefcase
} from 'lucide-react';

interface PartnerAppProps {
  district: District;
  upazila: string;
  lang: Language;
}

export const PartnerApp: React.FC<PartnerAppProps> = ({
  district,
  upazila,
  lang,
}) => {
  const [verification, setVerification] = useState<PartnerVerification>({
    nidNumber: '',
    status: 'Verified',
    blueTick: true,
  });

  const [wallet, setWallet] = useState<WalletState>({
    balance: 0,
    membershipActive: true,
    membershipExpiry: '৩১ ডিসেম্বর, ২০২৬',
    totalEarnings: 0,
    totalCommissionsPaid: 0,
    contactUnlockFeesPaid: 0,
    transactions: [],
  });

  const [incomingLeads, setIncomingLeads] = useState<any[]>([]);

  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState<number>(500);
  const [cashoutMethod, setCashoutMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank'>('bKash');
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  // Verification upload simulation states
  const [isUploadingNid, setIsUploadingNid] = useState(false);

  // Driver / Vehicle registration state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('CNG Auto Rickshaw (সিএনজি অটো)');
  const [vehicleRegNo, setVehicleRegNo] = useState('');
  const [driverNid, setDriverNid] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [driverRegMsg, setDriverRegMsg] = useState<string | null>(null);

  // Medical registration state
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medPhone, setMedPhone] = useState('');
  const [medRole, setMedRole] = useState<'Doctor' | 'Emergency Nurse' | 'Ambulance Provider'>('Emergency Nurse');
  const [medSpecialty, setMedSpecialty] = useState('');
  const [medBmdc, setMedBmdc] = useState('');

  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/drivers-vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName,
          phone: driverPhone,
          vehicleType,
          vehicleRegNo,
          district,
          upazila,
          nidNumber: driverNid,
          drivingLicense,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDriverRegMsg(data.message);
      }
    } catch (err) {
      alert('ড্রাইভার ডাটাবেজ সেভে সমস্যা হয়েছে।');
    }
  };

  const handleRegisterMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/services-medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: medName,
          phone: medPhone,
          role: medRole,
          specialtyBn: medSpecialty,
          district,
          upazila,
          bmdcRegNo: medBmdc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setIsMedicalModalOpen(false);
      }
    } catch (err) {
      alert('মেডিকেল ডাটাবেজ রেজিস্ট্রেশনে সমস্যা হয়েছে।');
    }
  };

  const handleUnlockContact = (leadId: string, fee: number) => {
    if (wallet.balance < fee) {
      alert('ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে রিচার্জ করুন।');
      return;
    }

    setWallet(w => ({
      ...w,
      balance: w.balance - fee,
      contactUnlockFeesPaid: w.contactUnlockFeesPaid + fee,
      transactions: [
        {
          id: `TXN-${Math.floor(100 + Math.random() * 900)}`,
          type: 'ContactUnlock',
          amount: -fee,
          descriptionBn: 'কাস্টমার কন্টাক্ট আনলক চার্জ',
          descriptionEn: 'Customer Contact Unlock Fee',
          date: 'এখনই',
          status: 'Success',
        },
        ...w.transactions
      ]
    }));

    setIncomingLeads(leads => leads.map(l => l.id === leadId ? { ...l, isUnlocked: true } : l));
  };

  const handleCashoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wallet.balance < cashoutAmount) {
      alert('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }
    if (cashoutAmount < 500) {
      alert('সর্বনিম্ন ক্যাশআউট পরিমাণ ৳৫০০');
      return;
    }

    setWallet(w => ({
      ...w,
      balance: w.balance - cashoutAmount,
      transactions: [
        {
          id: `TXN-CSH-${Math.floor(100 + Math.random() * 900)}`,
          type: 'Cashout',
          amount: -cashoutAmount,
          descriptionBn: `${cashoutMethod} এ ইন্সট্যান্ট ক্যাশআউট`,
          descriptionEn: `Instant Cashout to ${cashoutMethod}`,
          date: 'এখনই',
          status: 'Success',
        },
        ...w.transactions
      ]
    }));

    setCashoutSuccess(true);
  };

  return (
    <div className="space-y-6 pb-20 text-white">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-teal-500/10 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>সেবাদাতা / পার্টনার পোর্টাল</span>
            </span>
            {verification.blueTick && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ব্লু-টিক ভেরিফাইড পার্টনার</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {lang === 'bn' ? 'পার্টনার ও সার্ভিস প্রোভাইডার ড্যাশবোর্ড' : 'Partner & Service Provider Dashboard'}
          </h2>
          <p className="text-xs text-slate-400">
            {upazila}, {district} | সদস্যপদ স্ট্যাটাস: সক্রিয়
          </p>
        </div>

        {/* Quick Balance Status */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center space-x-4 w-full md:w-auto">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              পার্টনার ওয়ালেট ব্যালেন্স
            </span>
            <div className="text-2xl font-extrabold text-emerald-400">৳{wallet.balance}</div>
          </div>
          <button
            onClick={() => setIsCashoutModalOpen(true)}
            disabled={wallet.balance < 500}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer shadow-lg transition-all ${
              wallet.balance >= 500
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>ক্যাশআউট করুন (Min ৳500)</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Column (Verification & Leads), Right Column (Wallet & Financials) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Verification & Incoming Job Orders */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. NID & Selfie Verification Shield */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">
                  নিরাপত্তা ও NID ভেরিফিকেশন প্রোটোকল
                </h3>
              </div>
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-lg font-bold">
                স্ট্যাটাস: অ্যাকাউন্ট একটিভ (ব্লু-টিক)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ঝাদিমাদি প্ল্যাটফর্মে কাজ করার জন্য জাতীয় পরিচয়পত্র (NID) এবং লাইভ সেলফি ম্যাচ থাকা বাধ্যতামূলক। ভেরিফিকেশন ছাড়া কাস্টমারের কন্টাক্ট নম্বর আনলক করা বা কাজ পাওয়া অসম্ভব।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">১. NID স্মার্ট কার্ড</h4>
                  <p className="text-[11px] text-slate-400">স্মার্ট এনআইডি: {verification.nidNumber}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">২. লাইভ সেলফি ফেসিয়াল ম্যাচ</h4>
                  <p className="text-[11px] text-slate-400">এআই ক্যামেরা ফেসিয়াল ভেরিফাইড</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Direct Service / Driver Registration Database Actions */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setDriverRegMsg(null);
                  setIsDriverModalOpen(true);
                }}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-[#00A86B]/40 rounded-xl text-left transition-all cursor-pointer flex items-center space-x-3"
              >
                <div className="p-2 bg-[#00A86B]/20 text-[#00A86B] rounded-lg">
                  🚕
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">CNG, বাইক ও ড্রাইভার ডাটাবেজ</h5>
                  <p className="text-[10px] text-slate-400">যানবাহন ও লাইসেন্স রেজিস্ট্রেশন করুন</p>
                </div>
              </button>

              <button
                onClick={() => setIsMedicalModalOpen(true)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-rose-500/40 rounded-xl text-left transition-all cursor-pointer flex items-center space-x-3"
              >
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                  🩺
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">ডাক্তার, নার্স ও অ্যাম্বুলেন্স</h5>
                  <p className="text-[10px] text-slate-400">BMDC রেজিস্ট্রেশন ডাটাবেজ ভেরিফাই</p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Incoming Job Leads Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>কাছের নতুন কাস্টমার কাজের রিকোয়েস্ট (Leads Feed)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  আপনার ২ কিলোমিটার ব্যাসার্ধের মধ্যে থাকা অন-ডিমান্ড বুকিংসমূহ
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {incomingLeads.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                  <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">এই মুহূর্তে কোনো নতুন কাজের রিকোয়েস্ট নেই</p>
                  <p className="text-xs text-slate-500">আপনার এলাকায় কাস্টমার কাজ পোস্ট করলে এখানে তৎক্ষণাৎ দেখতে পাবেন।</p>
                </div>
              ) : (
                incomingLeads.map((lead) => (
                <div 
                  key={lead.id}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                        {lead.distanceKm} কিমি দূরে
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1">{lead.titleBn}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{lead.area}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">কাজের আনুমানিক বিল</span>
                      <span className="text-lg font-extrabold text-emerald-400">৳{lead.estimatedEarning}</span>
                    </div>
                  </div>

                  {/* Contact Unlock Status */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">কাস্টমারের ফোন নম্বর: </span>
                      {lead.isUnlocked ? (
                        <span className="font-bold text-emerald-300 underline">{lead.realPhone}</span>
                      ) : (
                        <span className="font-bold text-slate-500 flex items-center gap-1 inline-flex">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{lead.maskedPhone} (লক করা)</span>
                        </span>
                      )}
                    </div>

                    {lead.isUnlocked ? (
                      <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                        <Unlock className="w-3.5 h-3.5" />
                        <span>আনলকড</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUnlockContact(lead.id, lead.contactUnlockFee)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-amber-950 flex items-center space-x-1"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>নম্বর আনলক করুন (৳{lead.contactUnlockFee})</span>
                      </button>
                    )}
                  </div>
                </div>
              )))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Wallet & Financials Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span>ঝাদিমাদি ওয়ালেট হিসেব</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">মোট আয় (Total Earnings):</span>
                <span className="font-bold text-white">৳{wallet.totalEarnings}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">৫% সার্ভিস কমিশন প্রদান:</span>
                <span className="font-bold text-red-400">-৳{wallet.totalCommissionsPaid}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">কন্টাক্ট আনলক চার্জ খরচ:</span>
                <span className="font-bold text-amber-400">-৳{wallet.contactUnlockFeesPaid}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">বার্ষিক মেম্বারশিপ ফি:</span>
                <span className="font-bold text-emerald-400">৳১০০ / বছর (পরিশোধিত)</span>
              </div>
            </div>

            {/* Transactions History */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                সাম্প্রতিক লেনদেন
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {wallet.transactions.length === 0 ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                    কোনো সাম্প্রতিক লেনদেনের হিসেব নেই (০টি লেনদেন)
                  </div>
                ) : (
                  wallet.transactions.map((t) => (
                  <div key={t.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">{t.descriptionBn}</div>
                      <div className="text-[10px] text-slate-500">{t.date}</div>
                    </div>
                    <span className={`font-extrabold ${t.amount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {t.amount > 0 ? `+৳${t.amount}` : `৳${t.amount}`}
                    </span>
                  </div>
                )))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cashout Modal */}
      {isCashoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-white">
            <h3 className="font-bold text-base text-emerald-400 flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>ইন্সট্যান্ট ওয়ালেট ক্যাশআউট</span>
            </h3>

            {cashoutSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-bold text-lg">ক্যাশআউট রিকোয়েস্ট সফল!</h4>
                <p className="text-xs text-slate-300">
                  ৳{cashoutAmount} আপনার {cashoutMethod} ওয়ালেটে আগামী ১০ মিনিটের মধ্যে ক্রেডিট করা হবে।
                </p>
                <button
                  onClick={() => {
                    setIsCashoutModalOpen(false);
                    setCashoutSuccess(false);
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                >
                  ঠিক আছে
                </button>
              </div>
            ) : (
              <form onSubmit={handleCashoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    ক্যাশআউট পরিমাণ (সর্বনিম্ন ৳৫০০)
                  </label>
                  <input
                    type="number"
                    min={500}
                    max={wallet.balance}
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-extrabold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">পেমেন্ট মেথড</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['bKash', 'Nagad', 'Rocket', 'Bank'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCashoutMethod(m)}
                        className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          cashoutMethod === m
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCashoutModalOpen(false)}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ক্যাশআউট করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Driver & Vehicle Registration Modal (Save to DB, pending_approval status) */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-[#00A86B]/50 rounded-3xl w-full max-w-lg p-6 space-y-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-[#00A86B]">
                <span className="text-xl">🚕</span>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  CNG, বাইক ও যানবাহন ড্রাইভার ডাটাবেজ রেজিস্ট্রেশন
                </h3>
              </div>
              <button 
                onClick={() => setIsDriverModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {driverRegMsg ? (
              <div className="bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-200 leading-relaxed">
                  {driverRegMsg}
                </p>
                <div className="bg-slate-900 p-3 rounded-xl text-[11px] text-slate-300 text-left space-y-1">
                  <div><strong>ড্রাইভার:</strong> {driverName} ({driverPhone})</div>
                  <div><strong>যানবাহন:</strong> {vehicleType} ({vehicleRegNo})</div>
                  <div><strong>লোকেশন:</strong> {upazila}, {district}</div>
                  <div><strong>স্ট্যাটাস:</strong> <span className="text-amber-400 font-bold">pending_approval</span></div>
                </div>
                <button
                  onClick={() => setIsDriverModalOpen(false)}
                  className="w-full py-2 bg-[#00A86B] hover:bg-emerald-600 font-bold rounded-xl text-xs cursor-pointer"
                >
                  ঠিক আছে (বন্ধ করুন)
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterDriver} className="space-y-3 text-xs">
                <p className="text-[11px] text-slate-400 leading-normal">
                  আপনার যানবাহন ও ড্রাইভারের সকল ডকুমেন্টস ডাটাবেজে জমা হবে এবং এডমিন যাচাইয়ের পর গ্রাহকরা সরাসরি কল/হোয়াটসঅ্যাপে বুকিং দিতে পারবে।
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">চালকের পুরো নাম</label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">মোবাইল নম্বর</label>
                    <input
                      type="text"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">যানবাহনের ধরন</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="CNG Auto Rickshaw (সিএনজি অটো)">CNG Auto Rickshaw (সিএনজি অটো)</option>
                      <option value="Bike Delivery / Ride (বাইক)">Bike Delivery / Ride (বাইক)</option>
                      <option value="Chander Gari / Jeep (চাঁদের গাড়ি)">Chander Gari / Jeep (চাঁদের গাড়ি)</option>
                      <option value="Pickup Truck & Cargo (পিকআপ)">Pickup Truck & Cargo (পিকআপ)</option>
                      <option value="Tomtom / Cart (টমটম / কার্ট)">Tomtom / Cart (টমটম / কার্ট)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">যানবাহন রেজিস্ট্রেশন নম্বর</label>
                    <input
                      type="text"
                      required
                      value={vehicleRegNo}
                      onChange={(e) => setVehicleRegNo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      placeholder="যেমন: রাঙ্গামাটি-থ-১১-৪৫০২"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">জাতীয় পরিচয়পত্র (NID)</label>
                    <input
                      type="text"
                      required
                      value={driverNid}
                      onChange={(e) => setDriverNid(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">ড্রাইভিং লাইসেন্স নং</label>
                    <input
                      type="text"
                      required
                      value={drivingLicense}
                      onChange={(e) => setDrivingLicense(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#00A86B] hover:bg-emerald-600 font-extrabold text-white rounded-xl cursor-pointer shadow-lg shadow-emerald-950"
                  >
                    🚀 ডাটাবেজে সাবমিট করুন (Save & Pending Approval)
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Medical Registration Modal */}
      {isMedicalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl w-full max-w-lg p-6 space-y-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <span className="text-xl">🩺</span>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  ডাক্তার, নার্স ও মেডিকেল পারসোনেল ডাটাবেজ
                </h3>
              </div>
              <button 
                onClick={() => setIsMedicalModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterMedical} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">সেবাদাতার নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ড. অং থোয়াই মারমা"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    required
                    placeholder="01812334455"
                    value={medPhone}
                    onChange={(e) => setMedPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ক্যাটাগরি</label>
                  <select
                    value={medRole}
                    onChange={(e) => setMedRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Doctor">Doctor (এমবিবিএস ডাক্তার)</option>
                    <option value="Emergency Nurse">Emergency Nurse (জরুরি নার্স)</option>
                    <option value="Ambulance Provider">Ambulance Provider (অ্যাম্বুলেন্স)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">বিশেষজ্ঞতা / ডিগ্রি</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ডিপ্লোমা নার্সিং ও স্যালাইন/ইনজেকশন বিশেষজ্ঞ"
                  value={medSpecialty}
                  onChange={(e) => setMedSpecialty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">BMDC / BNMC রেজিস্ট্রেশন নম্বর</label>
                <input
                  type="text"
                  required
                  placeholder="BMDC-A-98412"
                  value={medBmdc}
                  onChange={(e) => setMedBmdc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 font-extrabold text-white rounded-xl cursor-pointer shadow-lg shadow-rose-950"
                >
                  🏥 মেডিকেল ডাটাবেজে সাবমিট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
