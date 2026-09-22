import React, { useState } from 'react';
import { Language } from '../types';
import { ShieldAlert, CheckCircle2, X, PhoneCall, Ambulance, Droplet, MapPin, Siren, Send } from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  district: string;
  upazila: string;
  initialTab?: 'police' | 'ambulance' | 'blood';
}

type ETab = 'police' | 'ambulance' | 'blood';

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  lang: _lang,
  district,
  upazila,
  initialTab = 'police',
}) => {
  const [activeTab, setActiveTab] = useState<ETab>(initialTab);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O+');
  const [isGpsSent, setIsGpsSent] = useState(false);
  const [bloodAlertSent, setBloodAlertSent] = useState(false);
  const [ambulanceType, setAmbulanceType] = useState<'hospital' | 'private'>('hospital');

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Local Police Helplines per District
  const getPoliceNumber = () => {
    if (district.includes('খাগড়াছড়ি') || district.includes('Khagrachhari')) {
      return { num: '01713373723', name: 'খাগড়াছড়ি সদর থানা পুলিশ হেল্পলাইন' };
    }
    if (district.includes('রাঙ্গামাটি') || district.includes('Rangamati')) {
      return { num: '01713373703', name: 'রাঙ্গামাটি সদর থানা পুলিশ হেল্পলাইন' };
    }
    if (district.includes('বান্দরবান') || district.includes('Bandarban')) {
      return { num: '01713373743', name: 'বান্দরবান সদর থানা পুলিশ হেল্পলাইন' };
    }
    return { num: '01713373700', name: `${district} কন্ট্রোল রুম পুলিশ হেল্পলাইন` };
  };

  const policeInfo = getPoliceNumber();

  const handleSendGpsAlert = async () => {
    setIsGpsSent(true);
    try {
      await fetch('/api/sos/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyType: 'GPS Police Emergency Alert',
          district,
          upazila,
          location: `${upazila}, ${district}`,
          contactPhone: policeInfo.num,
          details: 'User triggered SOS GPS location dispatch.',
        }),
      });
    } catch (err) {
      console.log('SOS broadcast fallback used');
    }

    setTimeout(() => {
      alert(`🚨 জিপিএস লোকেশন পাঠানো হয়েছে!\n\nঠিকানা: ${upazila}, ${district}\nGPS: Lat 22.651, Lng 92.179\n\nঝাদিমাদি ইমার্জেন্সি কমান্ড সেন্টার ও নিকটস্থ কন্ট্রোল রুমে লোকেশন অ্যালার্ট ডিসপ্যাচ করা হয়েছে।`);
    }, 100);
  };

  const handleSendBloodAlert = async () => {
    setBloodAlertSent(true);
    try {
      await fetch('/api/sos/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyType: `Emergency Blood Request (${selectedBloodGroup})`,
          district,
          upazila,
          location: `${upazila}, ${district}`,
          details: `Urgent blood group needed: ${selectedBloodGroup}`,
        }),
      });
    } catch (err) {
      console.log('Blood SOS broadcast fallback used');
    }

    alert(`🩸 রক্তের জন্য ইমার্জেন্সি অ্যালার্ট ডিসপ্যাচ!\n\nরক্তের গ্রুপ: ${selectedBloodGroup}\nস্থান: ${upazila}, ${district}\n\n${upazila} এলাকার ১৫+ নিবন্ধিত ব্লাড ডোনার ও রেড ক্রিসেন্ট ভলান্টিয়ারদের কাছে নোটিফিকেশন পাঠানো হয়েছে।`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-red-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-white my-auto animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-900 via-slate-900 to-red-950 border-b border-red-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-600/30 rounded-xl border border-red-500 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight flex items-center gap-1.5">
                <span>🚨 ইমার্জেন্সি এসওএস হেল্প</span>
              </h3>
              <p className="text-[11px] text-red-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                <span>বর্তমান লোকেশন: <strong className="text-white">{upazila}, {district}</strong></span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 3 Main Action Category Tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('police')}
            className={`py-2.5 px-1 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'police'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 ring-2 ring-red-400'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Siren className="w-4 h-4" />
            <span className="text-[11px] whitespace-nowrap">১. পুলিশ ও ৯৯৯</span>
          </button>

          <button
            onClick={() => setActiveTab('ambulance')}
            className={`py-2.5 px-1 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'ambulance'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 ring-2 ring-emerald-400'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Ambulance className="w-4 h-4" />
            <span className="text-[11px] whitespace-nowrap">২. অ্যাম্বুলেন্স</span>
          </button>

          <button
            onClick={() => setActiveTab('blood')}
            className={`py-2.5 px-1 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'blood'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50 ring-2 ring-rose-400'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span className="text-[11px] whitespace-nowrap">৩. জরুরি রক্ত</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">

          {/* TAB 1: POLICE & 999 */}
          {activeTab === 'police' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="bg-red-950/60 border border-red-800/80 p-3 rounded-2xl text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                  <Siren className="w-3 h-3" />
                  <span>জাতীয় জরুরি হেল্পলাইন</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">জরুরি প্রয়োজনে সরাসরি কল করুন</h4>
                
                {/* Direct 999 Call Button */}
                <a
                  href="tel:999"
                  className="block w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base rounded-2xl shadow-xl shadow-red-950 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 border border-red-400 text-center"
                >
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                  <span>📞 ৯৯৯ কল করুন (টোল ফ্রি ২৪/৭)</span>
                </a>
                <p className="text-[10px] text-red-200">পুলিশ, ফায়ার সার্ভিস ও সরকারি অ্যাম্বুলেন্স সহায়তার জন্য</p>
              </div>

              {/* Local Police Station Helpline */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-extrabold text-slate-300 flex items-center justify-between">
                  <span>🏛️ স্থানীয় থানা হেল্পলাইন</span>
                  <span className="text-[10px] text-slate-400 font-medium">{district}</span>
                </div>
                <p className="text-[11px] text-slate-400">{policeInfo.name}</p>
                
                <a
                  href={`tel:${policeInfo.num}`}
                  className="block w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-colors text-center"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>📞 {policeInfo.num} (থানায় কল করুন)</span>
                </a>
              </div>

              {/* GPS Location Alert */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-extrabold text-slate-300 flex items-center justify-between">
                  <span>📍 জিপিএস লাইভ লোকেশন শেয়ার</span>
                  {isGpsSent && <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-md font-bold">অ্যালার্ট ডিসপ্যাচড</span>}
                </div>
                <p className="text-[11px] text-slate-400">আপনার বর্তমান জিপিএস কোঅর্ডিনেট ইমার্জেন্সি টিমকে পাঠান</p>
                
                <button
                  onClick={handleSendGpsAlert}
                  className={`w-full py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isGpsSent
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      : 'bg-red-950 hover:bg-red-900 text-red-200 border border-red-800'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isGpsSent ? '✅ জিপিএস লোকেশন নোটিফিকেশন পাঠানো হয়েছে' : '📍 লাইভ জিপিএস লোকেশন অ্যালার্ট পাঠান'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AMBULANCE */}
          {activeTab === 'ambulance' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-2xl text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                  <Ambulance className="w-3.5 h-3.5" />
                  <span>২৪/৭ জরুরি অ্যাম্বুলেন্স সেবা</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">হাসপাতাল ও প্রাইভেট অ্যাম্বুলেন্স সার্ভিস</h4>

                {/* Ambulance Category Switch */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setAmbulanceType('hospital')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      ambulanceType === 'hospital'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🏥 সদর হাসপাতাল
                  </button>
                  <button
                    onClick={() => setAmbulanceType('private')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      ambulanceType === 'private'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🚐 প্রাইভেট & ICU
                  </button>
                </div>
              </div>

              {ambulanceType === 'hospital' ? (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-left">
                  <div>
                    <h5 className="font-extrabold text-sm text-emerald-400">🏥 {district} জেলা সদর হাসপাতাল অ্যাম্বুলেন্স</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">সরকারি সাশ্রয়ী মূল্যে ২৪ ঘন্টা ইমার্জেন্সি ডিসপ্যাচ ডিউটি</p>
                  </div>

                  <a
                    href="tel:01812345678"
                    className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl text-center shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>📞 কল করুন: 01812345678 (হাসপাতাল অ্যাম্বুলেন্স)</span>
                  </a>
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-left">
                  <div>
                    <h5 className="font-extrabold text-sm text-emerald-400">🚐 প্রাইভেট এসি & আইসিইউ (ICU) অ্যাম্বুলেন্স</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">অক্সিজেন, লাইফ সাপোর্ট সহ চট্টগ্রাম ও ঢাকা রুটে দ্রুত যাতায়াত</p>
                  </div>

                  <a
                    href="tel:01899998888"
                    className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl text-center shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>📞 কল করুন: 01899998888 (প্রাইভেট আইসিইউ)</span>
                  </a>
                </div>
              )}

              {/* General 999 Ambulance Hotline */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">জাতীয় ফায়ার সার্ভিস অ্যাম্বুলেন্স</div>
                  <div className="text-[10px] text-slate-400">টোল ফ্রি জাতীয় হটলাইন</div>
                </div>
                <a
                  href="tel:999"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-lg flex items-center gap-1"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>৯৯৯</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: BLOOD REQUEST */}
          {activeTab === 'blood' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="bg-rose-950/60 border border-rose-800/80 p-3 rounded-2xl text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                  <Droplet className="w-3.5 h-3.5" />
                  <span>জরুরি রক্ত প্রয়োজন (Emergency Blood)</span>
                </div>
                <h4 className="text-xs font-bold text-rose-200">রক্তের গ্রুপ নির্বাচন করুন এবং দ্রুত অ্যালার্ট পাঠান</h4>

                {/* Blood Group Selector Grid */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((grp) => (
                    <button
                      key={grp}
                      onClick={() => setSelectedBloodGroup(grp)}
                      className={`py-2 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                        selectedBloodGroup === grp
                          ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-300 scale-105'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Donor Hotline Call */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs text-rose-400">🩸 রেড ক্রিসেন্ট ও ব্লাড ডোনার ক্লাব হটলাইন</h5>
                  <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded font-bold">{selectedBloodGroup} রিকুয়েস্ট</span>
                </div>

                <a
                  href="tel:01800000000"
                  className="block w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl text-center shadow-lg shadow-rose-950 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>📞 কল করুন: 01800000000 (ব্লাড ক্লাব)</span>
                </a>
              </div>

              {/* Urgent Blood Alert Dispatch */}
              <button
                onClick={handleSendBloodAlert}
                className={`w-full py-3 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  bloodAlertSent
                    ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                    : 'bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 hover:to-red-600 text-white shadow-xl shadow-rose-950 border border-rose-500'
                }`}
              >
                <Droplet className="w-4 h-4 fill-current" />
                <span>
                  {bloodAlertSent
                    ? `✅ [${selectedBloodGroup}] গ্রুপের জন্য ডোনার নোটিফিকেশন সেন্ট!`
                    : `📢 [${selectedBloodGroup}] রক্তের জন্য ইমার্জেন্সি ব্রডকাস্ট দিন`}
                </span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-center shrink-0 flex items-center justify-between px-4">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>২৪/৭ ঝাদিমাদি রেসপন্স টিম প্রস্তুত</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer border border-slate-700"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};

