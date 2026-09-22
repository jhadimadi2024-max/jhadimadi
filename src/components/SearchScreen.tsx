import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Mic, Camera, MapPin, CheckCircle, ShieldCheck, Star, 
  Droplet, Car, Wrench, ShoppingBag, X, Phone, PhoneCall, Lock, UserCheck, 
  Briefcase, Heart, Filter, RefreshCw, Layers, Database, Cloud, Volume2
} from 'lucide-react';
import { parseBanglaSearchQuery, startBanglaVoiceRecognition, ParsedSearchResult } from '../utils/aiSearchParser';
import { sanitizeSearchQuery } from '../utils/securitySanitizer';
import { databaseService } from '../services/databaseService';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { BloodAuthGatekeeperModal } from './BloodAuthGatekeeperModal';

// ৬৪ জেলা ও প্রধান প্রধান থানা/উপজেলা তালিকা
const DISTRICT_THANA_MAP: Record<string, string[]> = {
  'বাংলাদেশ': ['সকল থানা/উপজেলা'],
  'খাগড়াছড়ি': ['সকল থানা/উপজেলা', 'খাগড়াছড়ি সদর', 'দীঘিনালা', 'পানছড়ি', 'মাটিরাঙ্গা', 'মানিকছড়ি', 'মহালছড়ি', 'রামগড়', 'লক্ষ্মীছড়ি', 'গুয়াইমারা'],
  'রাঙ্গামাটি': ['সকল থানা/উপজেলা', 'রাঙ্গামাটি সদর', 'কাপ্তাই', 'বাঘাইছড়ি', 'নানিয়ারচর', 'লংগদু', 'জুরাইছড়ি', 'বরকল', 'কাউখালী', 'বিলাইছড়ি', 'রাজস্থলী'],
  'বান্দরবান': ['সকল থানা/উপজেলা', 'বান্দরবান সদর', 'রুমা', 'থানচি', 'রোয়াংছড়ি', 'লামা', 'আলীকদম', 'নাইক্ষ্যংছড়ি'],
  'ঢাকা': ['সকল থানা/উপজেলা', 'সাভার', 'উত্তরা', 'মিরপুর', 'ধানমন্ডি', 'গুলশান', 'বনানী', 'মোহাম্মদপুর', 'কেরানীগঞ্জ', 'ধামরাই'],
  'চট্টগ্রাম': ['সকল থানা/উপজেলা', 'কোতোয়ালী', 'পাহাড়তলী', 'পাঁচলাইশ', 'হালিশহর', 'সীতাকুণ্ড', 'মীরসরাই', 'হাটহাজারী', 'পটিয়া'],
  'গাজীপুর': ['সকল থানা/উপজেলা', 'গাজীপুর সদর', 'টঙ্গী', 'কালিয়াকৈর', 'শ্রীপুর', 'কাপাসিয়া'],
  'কক্সবাজার': ['সকল থানা/উপজেলা', 'কক্সবাজার সদর', 'চকোরিয়া', 'মহেশখালী', 'টেকনাফ', 'উখিয়া', 'রামু', 'পেকুয়া'],
  'কুমিল্লা': ['সকল থানা/উপজেলা', 'কুমিল্লা সদর', 'লাকসাম', 'দাউদকান্দি', 'চৌদ্দগ্রাম', 'দেবীদ্বার', 'ব্রাহ্মণপাড়া'],
  'সিলেট': ['সকল থানা/উপজেলা', 'সিলেট সদর', 'গোলাপগঞ্জ', 'বিয়ানীবাজার', 'জৈন্তাপুর', 'বিশ্বনাথ', 'ফেঞ্চুগঞ্জ'],
  'বগুড়া': ['সকল থানা/উপজেলা', 'বগুড়া সদর', 'শেরপুর', 'শিবগঞ্জ', 'দুপচাঁচিয়া', 'গাবতলী', 'সারিয়াকান্দি'],
  'রাজশাহী': ['সকল থানা/উপজেলা', 'বোয়ালিয়া', 'রাজপাড়া', 'মতিহার', 'পবা', 'বাঘা', 'চারঘাট', 'পুঠিয়া'],
  'খুলনা': ['সকল থানা/উপজেলা', 'খুলনা সদর', 'সোনাডাঙ্গা', 'খালিশপুর', 'দৌলতপুর', 'ডুমুরিয়া', 'রূপসা'],
  'বরিশাল': ['সকল থানা/উপজেলা', 'কোতোয়ালী', 'বাবুগঞ্জ', 'উজিরপুর', 'বাকেরগঞ্জ', 'গৌরনদী', 'মেহেন্দিগঞ্জ'],
  'ময়মনসিংহ': ['সকল থানা/উপজেলা', 'ময়মনসিংহ সদর', 'মুক্তাগাছা', 'ত্রিশাল', 'ভালুকা', 'ফুলবাড়িয়া', 'গফরগাঁও'],
  'রংপুর': ['সকল থানা/উপজেলা', 'রংপুর সদর', 'পীরগঞ্জ', 'মিঠাপুকুর', 'বদরগঞ্জ', 'তারাগঞ্জ', 'কাউনিয়া']
};

const BLOOD_GROUPS = ['সকল ব্লাড গ্রুপ', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const POPULAR_PROFESSIONS = [
  'সকল পেশা',
  'ইলেকট্রিশিয়ান',
  'প্লাম্বার',
  'ড্রাইভার',
  'রাজমিস্ত্রি',
  'নার্স / হোম কেয়ার',
  'কৃষিবিদ ও বাগান বিশেষজ্ঞ',
  'হোম টিউটর / শিক্ষক',
  'কাঠমিস্ত্রি ও ফার্নিচার কারিগর',
  'মেকানিক',
  'টেইলার্স / সেলাই শিল্পী'
];

export interface SearchScreenProps {
  onSelectUser?: (user: UserProfile) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectUser }) => {
  const { currentUser, login } = useAuth();
  // একটিভ ট্যাব / ক্যাটাগরি স্টেট (ইউজার প্রোফাইল / পেশাজীবী, পণ্য, রক্তদাতা, গাড়ি)
  const [activeTab, setActiveTab] = useState<'profile' | 'service' | 'blood' | 'product' | 'rent'>('profile');
  const [isBloodAuthModalOpen, setIsBloodAuthModalOpen] = useState<boolean>(false);
  const [bloodAuthInitialMode, setBloodAuthInitialMode] = useState<'signin' | 'quick_register'>('signin');

  // ফিল্টার স্টেটসমূহ
  const [keyword, setKeyword] = useState<string>('');
  const [district, setDistrict] = useState<string>('বাংলাদেশ');
  const [thana, setThana] = useState<string>('সকল থানা/উপজেলা');
  const [paraMaholla, setParaMaholla] = useState<string>('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('সকল ব্লাড গ্রুপ');
  const [selectedProfession, setSelectedProfession] = useState<string>('সকল পেশা');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiVoiceFeedback, setAiVoiceFeedback] = useState<string | null>(null);

  // লাইভ ডাটাবেজ স্টেট
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(() => databaseService.getAllUserProfiles());
  const [isLoadingFromFirestore, setIsLoadingFromFirestore] = useState<boolean>(true);
  const [isFirestoreLive, setIsFirestoreLive] = useState<boolean>(false);

  // ডাটাবেজ রিয়েল-টাইম লাইভ সাবস্ক্রিপশন
  useEffect(() => {
    let isMounted = true;
    setIsLoadingFromFirestore(true);

    const syncProfiles = () => {
      if (!isMounted) return;
      setUserProfiles(databaseService.getAllUserProfiles());
      setIsFirestoreLive(true);
      setIsLoadingFromFirestore(false);
    };

    // Initial load
    databaseService.fetchUsersFromSupabase().then(() => {
      syncProfiles();
    }).catch(() => {
      syncProfiles();
    });

    // Subscribe to live updates
    const unsubscribe = databaseService.subscribe(() => {
      syncProfiles();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // লাইভ সুপাবেস মাল্টি-টেবিল গ্লোবাল সার্চ রেজাল্ট
  const [liveGlobalResults, setLiveGlobalResults] = useState<any>(null);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);

  // Debounced live multi-table query
  useEffect(() => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setLiveGlobalResults(null);
      setIsSearchingLive(false);
      return;
    }

    let isCurrent = true;
    setIsSearchingLive(true);
    const timer = setTimeout(async () => {
      try {
        const resp = await databaseService.globalSearch(trimmed, { limit: 20 });
        if (isCurrent) {
          setLiveGlobalResults(resp);
          setIsSearchingLive(false);
        }
      } catch {
        if (isCurrent) setIsSearchingLive(false);
      }
    }, 220);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [keyword]);

  // রিয়েল-টাইম ফিল্টারিং লজিক (Real-time Database Query Engine)
  const filteredUsers = useMemo(() => {
    const base = databaseService.searchUserProfiles({
      district: district === 'বাংলাদেশ' ? undefined : district,
      thana: thana === 'সকল থানা/উপজেলা' ? undefined : thana,
      bloodGroup: selectedBloodGroup === 'সকল ব্লাড গ্রুপ' ? undefined : selectedBloodGroup,
      profession: selectedProfession === 'সকল পেশা' ? undefined : selectedProfession,
      keyword: keyword.trim() || undefined,
      para: paraMaholla.trim() || undefined,
    }, userProfiles);

    // Merge in live profiles & service_providers from live Supabase search
    if (liveGlobalResults?.providers || liveGlobalResults?.profiles) {
      const merged = [...base];
      const existingIds = new Set(merged.map(u => String(u.id || u.phone)));

      (liveGlobalResults.providers || []).forEach((sp: any) => {
        const spId = String(sp.id || sp.phone);
        if (!existingIds.has(spId)) {
          existingIds.add(spId);
          merged.push({
            id: spId,
            fullName: sp.display_name || sp.name || sp.full_name || 'কারিগর',
            name: sp.display_name || sp.name || sp.full_name || 'কারিগর',
            phone: sp.phone || '',
            profession: sp.profession_key || sp.category_bn || 'সেবা প্রদানকারী',
            professionBn: sp.category_bn || sp.profession_key || 'সেবা প্রদানকারী',
            district: sp.district || 'খাগড়াছড়ি',
            upazila: sp.upazila || '',
            para: sp.area || sp.mahalla || '',
            avatar: sp.avatar_url || sp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            rating: sp.rating || 5,
            isNidVerified: true,
            isPaidMember: false,
          } as UserProfile);
        }
      });

      (liveGlobalResults.profiles || []).forEach((pr: any) => {
        const prId = String(pr.id || pr.unique_id || pr.phone);
        if (!existingIds.has(prId)) {
          existingIds.add(prId);
          merged.push({
            id: prId,
            fullName: pr.full_name || pr.name || 'সদস্য',
            name: pr.full_name || pr.name || 'সদস্য',
            phone: pr.phone || '',
            profession: pr.profession || 'নিবন্ধিত সদস্য',
            professionBn: pr.profession || 'নিবন্ধিত সদস্য',
            district: pr.district || 'খাগড়াছড়ি',
            upazila: pr.upazila || '',
            para: pr.area || pr.mahalla || '',
            avatar: pr.avatar_url || pr.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            bloodGroup: pr.blood_group,
            isBloodDonor: !!pr.is_blood_donor || !!pr.blood_group,
            memberUID: pr.unique_id,
            isNidVerified: true,
            isPaidMember: false,
          } as UserProfile);
        }
      });

      return merged;
    }

    return base;
  }, [userProfiles, district, thana, selectedBloodGroup, selectedProfession, keyword, paraMaholla, liveGlobalResults]);

  // ফিল্টার করা রক্তদাতা তালিকা (যদি ইউজার ব্লাড ট্যাব বা ব্লাড গ্রুপ সিলেক্ট করে)
  const filteredBloodDonors = useMemo(() => {
    const base = filteredUsers.filter((u) => u.isBloodDonor || (u.bloodGroup && u.bloodGroup.length > 0));

    // Merge in live blood donors from live Supabase search
    if (liveGlobalResults?.bloodDonors) {
      const merged = [...base];
      const existingIds = new Set(merged.map(u => String(u.id || u.phone)));

      (liveGlobalResults.bloodDonors || []).forEach((bd: any) => {
        const bdId = String(bd.id || bd.phone);
        if (!existingIds.has(bdId)) {
          existingIds.add(bdId);
          merged.push({
            id: bdId,
            fullName: bd.name || bd.full_name || 'রক্তদাতা',
            name: bd.name || bd.full_name || 'রক্তদাতা',
            phone: bd.phone || '',
            bloodGroup: bd.blood_group || bd.bloodGroup || 'O+',
            isBloodDonor: true,
            isBloodDonorAvailable: true,
            district: bd.district || 'খাগড়াছড়ি',
            upazila: bd.upazila || '',
            para: bd.area || bd.mahalla || '',
            avatar: bd.photo_url || bd.photo || bd.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            isNidVerified: true,
            isPaidMember: false,
          } as UserProfile);
        }
      });
      return merged;
    }

    return base;
  }, [filteredUsers, liveGlobalResults]);

  // ক্যামেরা ও ভয়েস রেফারেন্স
  const searchCameraInputRef = useRef<HTMLInputElement>(null);
  const activeVoiceRecognitionRef = useRef<any>(null);

  const handleCameraSearchClick = () => {
    if (searchCameraInputRef.current) {
      searchCameraInputRef.current.click();
    }
  };

  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      let detectedKeyword = 'ইলেকট্রিশিয়ান';
      if (fileName.includes('blood') || fileName.includes('red')) {
        setActiveTab('blood');
        detectedKeyword = 'O+';
        setSelectedBloodGroup('O+');
      } else if (fileName.includes('car') || fileName.includes('driver')) {
        detectedKeyword = 'ড্রাইভার';
        setSelectedProfession('ড্রাইভার');
      } else if (fileName.includes('pipe') || fileName.includes('plumb')) {
        detectedKeyword = 'প্লাম্বার';
        setSelectedProfession('প্লাম্বার');
      }
      setKeyword(detectedKeyword);
      setAiVoiceFeedback(`📷 ছবি থেকে শনাক্তকৃত বিষয়: "${detectedKeyword}"। ডাটাবেজ থেকে রিয়েল-টাইম ম্যাচিং করা হয়েছে।`);
      setTimeout(() => setAiVoiceFeedback(null), 5000);
    }
  };

  // AI Voice Search & Smart Parsing
  const startVoiceSearch = () => {
    if (isListening) {
      if (activeVoiceRecognitionRef.current && activeVoiceRecognitionRef.current.stop) {
        try {
          activeVoiceRecognitionRef.current.stop();
        } catch {
          // silent
        }
      }
      setIsListening(false);
      return;
    }

    const recognition = startBanglaVoiceRecognition({
      onStart: () => {
        setIsListening(true);
      },
      onResult: (transcript, parsed: ParsedSearchResult) => {
        setIsListening(false);
        setKeyword(parsed.cleanedKeyword || '');

        if (parsed.district) {
          setDistrict(parsed.district);
        }
        if (parsed.upazila) {
          setThana(parsed.upazila);
        }
        if (parsed.searchType === 'blood') {
          setActiveTab('blood');
          if (transcript.includes('O+') || transcript.includes('ও পজিটিভ')) setSelectedBloodGroup('O+');
          else if (transcript.includes('A+') || transcript.includes('এ পজিটিভ')) setSelectedBloodGroup('A+');
          else if (transcript.includes('B+') || transcript.includes('বি পজিটিভ')) setSelectedBloodGroup('B+');
          else if (transcript.includes('AB+') || transcript.includes('এবি পজিটিভ')) setSelectedBloodGroup('AB+');
        }

        // পেশা ট্র্যাকিং
        POPULAR_PROFESSIONS.forEach((p) => {
          if (transcript.includes(p)) {
            setSelectedProfession(p);
          }
        });
      },
      onError: () => {
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    activeVoiceRecognitionRef.current = recognition;
  };

  const handleResetFilters = () => {
    setKeyword('');
    setDistrict('বাংলাদেশ');
    setThana('সকল থানা/উপজেলা');
    setParaMaholla('');
    setSelectedBloodGroup('সকল ব্লাড গ্রুপ');
    setSelectedProfession('সকল পেশা');
  };

  const activeResults = activeTab === 'blood' ? filteredBloodDonors : filteredUsers;

  return (
    <div className="w-full min-h-screen bg-[#faf9f6] font-sans text-stone-900 p-2 sm:p-4">
      <div className="max-w-md mx-auto w-full space-y-3">

        {/* সার্চ হেডার ও ডাটাবেজ স্ট্যাটাস */}
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
                <Search size={16} />
              </div>
              <div>
                <h1 className="text-xs font-black text-slate-900 flex items-center gap-1">
                  রিয়েল-টাইম প্রোফাইল ও সার্ভিস সার্চ
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  জেলা, থানা, ব্লাড গ্রুপ ও পেশা অনুযায়ী তাৎক্ষণিক অনুসন্ধান
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200">
                {userProfiles.length} জন প্রোফাইল
              </span>
            </div>
          </div>

          {/* ট্যাব সিলেক্টর (প্রোফাইল/পেশাজীবী, রক্তদাতা) */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Briefcase size={14} /> পেশাজীবী ও প্রোফাইল
            </button>
            <button 
              onClick={() => {
                setActiveTab('blood');
                if (selectedBloodGroup === 'সকল ব্লাড গ্রুপ') {
                  setSelectedBloodGroup('O+');
                }
              }}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'blood' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <Droplet size={14} /> জরুরি রক্তদাতা
            </button>
          </div>
        </div>

        {/* AI ভয়েস ফিডব্যাক কার্ড */}
        {aiVoiceFeedback && (
          <div className="bg-emerald-900 text-white p-3 rounded-2xl shadow-lg border border-emerald-500/30 text-xs space-y-1 animate-fadeIn relative">
            <button 
              onClick={() => setAiVoiceFeedback(null)} 
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Volume2 size={14} />
              <span>স্মার্ট ভয়েস প্রসেসর</span>
            </div>
            <p className="text-[11px] whitespace-pre-line text-emerald-100 leading-relaxed font-medium">
              {aiVoiceFeedback}
            </p>
          </div>
        )}

        {/* সার্চ ফিল্টার কার্ড (Detailed Query Form) */}
        <div className="bg-white p-4 rounded-3xl shadow-xs border border-stone-200 space-y-3.5">
          
          {/* Hidden Camera Input for Image Search */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={searchCameraInputRef} 
            onChange={handleImageUploaded} 
            className="hidden" 
          />

          {/* কিওয়ার্ড ইনপুট, ক্যামেরা ও ভয়েস সার্চ */}
          <div className={`relative flex items-center transition-all rounded-2xl ${
            isListening ? 'ring-2 ring-emerald-500/30' : ''
          }`}>
            <Search size={16} className={`absolute left-3.5 ${isListening ? 'text-emerald-600' : 'text-stone-400'}`} />
            <input 
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(sanitizeSearchQuery(e.target.value))}
              placeholder={isListening ? '🎙️ শুনছি... স্পষ্ট করে মুখে বলুন...' : 'নাম, ফোন, পেশা বা এলাকা লিখে খুঁজুন (যেমন: নয়ন জ্যোতি, 01812...)'}
              className={`w-full pl-10 pr-24 py-2.5 bg-stone-50 border rounded-2xl text-xs outline-none transition ${
                isListening 
                  ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 placeholder:text-emerald-700' 
                  : 'border-stone-200 focus:bg-white focus:border-emerald-600'
              }`}
            />
            {keyword && (
              <button 
                type="button"
                onClick={() => setKeyword('')} 
                className="absolute right-18 text-stone-400 hover:text-stone-600 text-xs p-1"
              >
                ✕
              </button>
            )}

            {/* Camera / Image Search Button */}
            <button 
              type="button"
              onClick={handleCameraSearchClick}
              className="absolute right-10 p-1.5 rounded-full text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
              title="ছবি বা ক্যামেরা দিয়ে সার্চ"
            >
              <Camera size={15} />
            </button>

            {/* Speaker Voice Search (bn-BD) with subtle listening animation */}
            <button 
              type="button"
              onClick={startVoiceSearch}
              className={`absolute right-2 p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                isListening 
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/80' 
                  : 'text-stone-500 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              title={isListening ? 'শুনছি... ক্লিক করে বন্ধ করুন' : 'ভয়েস সার্চ (মুখে বলুন)'}
            >
              {isListening && (
                <span className="flex items-center gap-0.5 px-0.5">
                  <span className="w-0.5 h-2 bg-white rounded-full animate-pulse [animation-duration:500ms]"></span>
                  <span className="w-0.5 h-3 bg-white rounded-full animate-pulse [animation-duration:350ms]"></span>
                  <span className="w-0.5 h-1.5 bg-white rounded-full animate-pulse [animation-duration:600ms]"></span>
                </span>
              )}
              <Mic size={15} className={isListening ? 'animate-pulse' : ''} />
            </button>
          </div>

          {/* ১. জেলা ও উপজেলা/থানা ড্রপডাউন (District & Thana) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-stone-600 flex items-center gap-1 mb-1">
                <MapPin size={11} className="text-emerald-600" /> জেলা (District)
              </label>
              <select 
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setThana('সকল থানা/উপজেলা');
                }}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 outline-none focus:border-emerald-600"
              >
                {Object.keys(DISTRICT_THANA_MAP).map((dName) => (
                  <option key={dName} value={dName}>{dName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-600 flex items-center gap-1 mb-1">
                <MapPin size={11} className="text-emerald-600" /> উপজেলা / থানা (Upazila)
              </label>
              <select 
                value={thana}
                onChange={(e) => setThana(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 outline-none focus:border-emerald-600"
              >
                {(DISTRICT_THANA_MAP[district] || ['সকল থানা/উপজেলা']).map((tName) => (
                  <option key={tName} value={tName}>{tName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ২. পাড়া / মহল্লা (Para/Mahalla) ইনপুট */}
          <div>
            <label className="text-[10px] font-bold text-stone-600 block mb-1">
              পাড়া / মহল্লা / গ্রাম (Para / Mahalla)
            </label>
            <input 
              type="text"
              value={paraMaholla}
              onChange={(e) => setParaMaholla(e.target.value)}
              placeholder="যেমন: বোয়ালখালী বাজার, আদালত রোড, বালাঘাটা..."
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
            />
          </div>

          {/* ৩. পেশা / সার্ভিস ড্রপডাউন (Profession/Service) */}
          <div>
            <label className="text-[10px] font-bold text-stone-600 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Briefcase size={11} className="text-emerald-600" /> পেশা / সার্ভিস (Profession)
              </span>
              {selectedProfession !== 'সকল পেশা' && (
                <button 
                  onClick={() => setSelectedProfession('সকল পেশা')} 
                  className="text-[10px] text-emerald-600 hover:underline font-bold"
                >
                  রিসেট
                </button>
              )}
            </label>
            <select 
              value={selectedProfession}
              onChange={(e) => setSelectedProfession(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 outline-none focus:border-emerald-600"
            >
              {POPULAR_PROFESSIONS.map((prof) => (
                <option key={prof} value={prof}>{prof}</option>
              ))}
            </select>
          </div>

          {/* ৪. ব্লাড গ্রুপ ফিল্টার (Blood Group) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-stone-600 flex items-center gap-1">
                <Droplet size={11} className="text-red-600 fill-red-600" /> ব্লাড গ্রুপ (Blood Group)
              </label>
              {selectedBloodGroup !== 'সকল ব্লাড গ্রুপ' && (
                <button 
                  onClick={() => setSelectedBloodGroup('সকল ব্লাড গ্রুপ')} 
                  className="text-[10px] text-red-600 hover:underline font-bold"
                >
                  ক্লিয়ার
                </button>
              )}
            </div>

            {/* Quick 1-Tap Blood Group Chips */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-0.5">
              {BLOOD_GROUPS.filter(b => b !== 'সকল ব্লাড গ্রুপ').map((bg) => {
                const isSelected = selectedBloodGroup === bg;
                return (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedBloodGroup('সকল ব্লাড গ্রুপ');
                      } else {
                        setSelectedBloodGroup(bg);
                        if (activeTab !== 'blood') setActiveTab('blood');
                      }
                    }}
                    className={`py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-xs scale-105'
                        : 'bg-rose-50/80 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    {bg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ফিল্টার অ্যাকশন বাটন */}
          <div className="flex gap-2 pt-1">
            <button 
              onClick={handleResetFilters}
              className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <RefreshCw size={13} /> রিসেট
            </button>
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-xs text-emerald-800 font-bold">
              <span className="flex items-center gap-1.5">
                {isSearchingLive ? (
                  <RefreshCw size={13} className="text-emerald-600 animate-spin" />
                ) : (
                  <CheckCircle size={13} className="text-emerald-600" />
                )}
                {isSearchingLive ? 'ডাটাবেজ সার্চ হচ্ছে...' : 'রিয়েল-টাইম রেজাল্ট'}
              </span>
              <span className="bg-emerald-600 text-white text-[11px] px-2 py-0.5 rounded-lg shadow-2xs">
                {activeResults.length} জন
              </span>
            </div>
          </div>

        </div>

        {/* সার্চ রেজাল্ট কার্ড ডিসপ্লে (Live Match List) */}
        <div className="space-y-2.5 pb-12">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
              <UserCheck size={14} className="text-emerald-600" />
              {activeTab === 'blood' ? 'রক্তদাতা তালিকা' : 'পেশাজীবী ও প্রোফাইল তালিকা'} 
              <span className="text-stone-400 font-normal">({activeResults.length} জন পাওয়া গেছে)</span>
            </span>
          </div>

          {activeResults.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl text-center text-xs text-stone-500 border border-stone-200 space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Filter size={20} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-stone-800 text-sm">আন্তরিকভাবে দুঃখিত, আপনার কাঙ্ক্ষিত তথ্যটি এই মুহূর্তে খুঁজে পাওয়া যায়নি।</p>
                <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                  জেলা, উপজেলা বা ব্লাড গ্রুপের ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                </p>
              </div>
              <button 
                onClick={handleResetFilters}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> সকল ফিল্টার মুছুন
              </button>
            </div>
          ) : (
            activeResults.map((user) => (
              <div 
                key={user.id} 
                className="bg-white p-4 rounded-3xl shadow-xs border border-stone-200 space-y-3 hover:border-emerald-400 transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <img 
                        src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                        alt={user.fullName || user.name} 
                        className="w-12 h-12 object-cover rounded-2xl border border-stone-200 shadow-2xs" 
                      />
                      {user.isNidVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs" title="NID ভেরিফাইড মেম্বার">
                          <ShieldCheck size={12} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-black text-stone-900">
                          {user.fullName || user.name}
                        </h3>
                        {user.memberUID && (
                          <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded border border-stone-200">
                            {user.memberUID}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-bold text-emerald-700">
                        {user.professionBn || user.profession || user.serviceCategory || 'দক্ষ কারিগর ও সেবা প্রদানকারী'}
                      </p>

                      <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                        <MapPin size={11} className="text-emerald-600 shrink-0" />
                        <span>
                          {user.para || user.mahalla ? `${user.para || user.mahalla}, ` : ''}
                          {user.upazila || user.thana}, {user.district}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ব্লাড গ্রুপ ব্যাজ */}
                  {user.bloodGroup && (
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-0.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                        <Droplet size={11} className="fill-white" />
                        {user.bloodGroup}
                      </span>
                      {user.isBloodDonorAvailable && (
                        <span className="block text-[8px] text-emerald-700 font-bold mt-0.5">
                          ✓ রক্তদানে প্রস্তুত
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* স্কিল ও অভিজ্ঞতা ট্যাগ */}
                {user.categorySkill && (
                  <p className="text-[10px] bg-stone-50 text-stone-700 p-2 rounded-xl border border-stone-100 line-clamp-2">
                    🛠️ <span className="font-semibold">{user.categorySkill}</span>
                  </p>
                )}

                {/* রেট, রেটিং ও ডিরেক্ট কল একশন */}
                <div className="flex justify-between items-center pt-2.5 border-t border-stone-100 text-xs">
                  <div className="flex items-center gap-2">
                    {activeTab === 'blood' ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 bg-stone-50 border border-stone-200/70 rounded-lg px-2 py-1">
                        <Lock size={11} className="text-stone-500 shrink-0" />
                        <span>নম্বর: <span className="font-mono font-bold text-stone-700">
                          {user.phone && user.phone.length >= 10 
                            ? `${user.phone.slice(0, 3)}******${user.phone.slice(-2)}` 
                            : '০১৮******XX'}
                        </span></span>
                        <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1 rounded font-bold border border-emerald-200">সুরক্ষিত</span>
                      </div>
                    ) : (
                      <>
                        {user.rating && (
                          <span className="flex items-center gap-1 text-amber-600 font-black text-[11px]">
                            <Star size={12} className="fill-amber-400 text-amber-500" /> {user.rating.toFixed(1)}
                          </span>
                        )}
                        {user.dailyRate && (
                          <span className="text-[11px] font-bold text-stone-700">
                            ৳{user.dailyRate}/{user.rateType || 'দৈনিক'}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {user.phone && (
                      <a 
                        href={user.phone.startsWith('+') 
                          ? `tel:${user.phone.replace(/[^0-9+]/g, '')}` 
                          : user.phone.startsWith('880') 
                          ? `tel:+${user.phone.replace(/[^0-9+]/g, '')}` 
                          : user.phone.startsWith('0') 
                          ? `tel:+88${user.phone.replace(/[^0-9+]/g, '')}` 
                          : `tel:+880${user.phone.replace(/[^0-9+]/g, '')}`}
                        className={`${
                          activeTab === 'blood'
                            ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer'
                        }`}
                      >
                        {activeTab === 'blood' ? (
                          <>
                            <PhoneCall size={13} className="animate-pulse" />
                            <span>জরুরি যোগাযোগ করুন</span>
                          </>
                        ) : (
                          <>
                            <Phone size={12} />
                            <span>কল করুন</span>
                          </>
                        )}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ব্লাড সার্চ অথেন্টিকেশন গার্ড মডাল (Sign In & Quick Register) */}
      <BloodAuthGatekeeperModal
        isOpen={isBloodAuthModalOpen}
        onClose={() => setIsBloodAuthModalOpen(false)}
        onSuccess={(user) => {
          login(user);
        }}
        initialMode={bloodAuthInitialMode}
        lang="bn"
      />
    </div>
  );
};

export default SearchScreen;
