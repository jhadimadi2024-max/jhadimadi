import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Mic, MicOff, Volume2, VolumeX, Bot, User, 
  Phone, ShoppingCart, CheckCheck, Clock, Sparkles, 
  ArrowLeft, ShieldCheck, ChevronRight, Play, Pause, 
  MessageSquare, Headphones, RefreshCw, ExternalLink,
  Package, MapPin, Truck, AlertTriangle, CheckCircle2,
  Droplet, ArrowRight, Search, Wrench, Briefcase, AlertCircle, UserCheck,
  Languages
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { 
  askGeminiSupportChat, 
  smartSearchGemini, 
  GeminiProductRecommendation, 
  GeminiActionLink,
  GeminiSmartSearchResponse 
} from '../services/gemini';
import { StoreProduct } from '../data/productsData';
import { useData } from '../context/DataContext';
import { startBanglaVoiceRecognition } from '../utils/aiSearchParser';
import { matchesSmartProduct } from '../utils/fuzzySearch';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

export interface JhadimadiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'admin' | 'system';
  text: string;
  isVoice?: boolean;
  voiceDuration?: string;
  isOrder?: boolean;
  orderData?: {
    is_order: boolean;
    order_status?: string;
    customer_name?: string;
    phone?: string;
    address?: string;
    delivery_address?: string;
    product?: string;
    items?: Array<{ product_name?: string; name?: string; quantity?: number }>;
  };
  recommendedProducts?: GeminiProductRecommendation[];
  actionLink?: GeminiActionLink;
  quickReplyChips?: string[];
  serviceInfo?: {
    title: string;
    rate: string;
    deliveryTime: string;
    category: string;
  };
  preliminaryNotice?: string;
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
  clarificationChips?: string[];
  searchResultData?: {
    matchType: 'product' | 'provider' | 'blood' | 'job_seeker' | 'job_circular' | 'service' | 'member';
    hasRealMatches: boolean;
    explanation: string;
    preliminaryNotice?: string;
    clarificationNeeded?: boolean;
    clarificationQuestion?: string;
    clarificationChips?: string[];
    structuredIntent?: {
      profession?: string;
      location?: string;
      budget?: string;
      date?: string;
      availability?: string;
      ratingPreference?: string;
    };
    items: any[];
  };
  timestamp: string;
}

export interface JhadimadiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  setLang?: (lang: Language) => void;
  currentUser?: UserProfile | null;
  onAddToCart?: (product: StoreProduct, qty?: number) => void;
  onDirectOrder?: (product: StoreProduct) => void;
  onOpenProductDetails?: (product: StoreProduct) => void;
  onOpenNidVerification?: () => void;
  onOpenBloodSearch?: (bloodGroup?: string) => void;
  onOpenHelplineModal?: () => void;
  onOpenFeed?: (postId?: string) => void;
  onOpenProfile?: (person: any) => void;
}

// Privacy-safe contact link renderer: Never print or display raw phone numbers directly inside the chat interface/text response.
function renderChatMessageContent(text: string) {
  if (!text) return null;

  // Mask private phone numbers in plain text according to privacy mandate, while preserving the official Jhadimadi WhatsApp/Helpline number (01870592699)
  const maskedText = text.replace(/(?:\+?880|0)?1[3-9]\d{8}\b/g, (match) => {
    const clean = match.replace(/[^0-9]/g, '');
    if (clean === '01870592699' || clean === '8801870592699') {
      return match;
    }
    return '[নম্বর গোপন রাখা হয়েছে - প্রোফাইল দেখুন]';
  });

  const linkRegex = /<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  if (!linkRegex.test(maskedText)) {
    return maskedText;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = /<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  while ((match = regex.exec(maskedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(maskedText.substring(lastIndex, match.index));
    }
    const href = match[1];
    const linkLabel = match[2];
    const isTel = href.startsWith('tel:');

    parts.push(
      <a
        key={`link_${match.index}`}
        href={href}
        className={
          isTel
            ? 'inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-full text-xs transition duration-150 my-1 cursor-pointer no-underline shadow-2xs active:scale-95'
            : 'text-emerald-700 hover:text-emerald-900 underline font-semibold'
        }
        target={isTel ? undefined : '_blank'}
        rel={isTel ? undefined : 'noopener noreferrer'}
      >
        {isTel && <span className="text-sm">📞</span>}
        <span>{linkLabel}</span>
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < maskedText.length) {
    parts.push(maskedText.substring(lastIndex));
  }

  return <>{parts}</>;
}

export const JhadimadiChatModal: React.FC<JhadimadiChatModalProps> = ({
  isOpen,
  onClose,
  lang = 'bn',
  setLang,
  currentUser,
  onAddToCart,
  onDirectOrder,
  onOpenProductDetails,
  onOpenNidVerification,
  onOpenBloodSearch,
  onOpenHelplineModal,
  onOpenFeed,
  onOpenProfile,
}) => {
  const { products: liveProducts, posts: livePosts, users: liveUsers } = useData();

  const createWelcomeMessage = (): JhadimadiChatMessage => {
    return {
      id: 'welcome_1',
      sender: 'assistant',
      text: `হাই! আমি ঝাদিমাদি এআই (Jhadimadi AI)। আপনার যেকোনো প্রয়োজন বা তথ্য খোঁজার কাজে আমি আপনাকে সাহায্য করতে প্রস্তুত। বলুন, আজ আপনাকে কীভাবে সাহায্য করতে পারি?`,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const [messages, setMessages] = useState<JhadimadiChatMessage[]>([createWelcomeMessage()]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(true); // Voice output disabled by default per Rule 3
  const [activeVoicePlayingId, setActiveVoicePlayingId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminName, setAdminName] = useState<string>('সজিব চাকমা (সিনিয়র সাপোর্ট অফিসার)');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Reset chat to clean welcome message
  const handleResetChat = () => {
    setMessages([createWelcomeMessage()]);
    setIsAdminMode(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecordingVoice]);

  // Clean close on Escape key
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

  // Speak text using Web Speech API
  const speakText = (text: string) => {
    if (isAudioMuted) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Strip markdown stars or bullet points for speech
        const cleanText = text.replace(/[*_#•]/g, '').slice(0, 180);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Toggle voice playback simulation for a voice bubble
  const handleToggleVoicePlayback = (msgId: string, text: string) => {
    if (activeVoicePlayingId === msgId) {
      setActiveVoicePlayingId(null);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setActiveVoicePlayingId(msgId);
      speakText(text);
      setTimeout(() => {
        setActiveVoicePlayingId(null);
      }, 4000);
    }
  };

  // Voice Recognition handler (Web Speech API & Mobile MediaRecorder Fallback)
  const handleStartVoiceRecording = () => {
    try {
      if (isRecordingVoice) {
        if (speechRecognitionRef.current && typeof speechRecognitionRef.current.stop === 'function') {
          speechRecognitionRef.current.stop();
        }
        setIsRecordingVoice(false);
        return;
      }

      const handle = startBanglaVoiceRecognition({
        onStart: () => {
          setIsRecordingVoice(true);
        },
        onResult: (transcript) => {
          if (transcript) {
            handleSendVoiceMessage(transcript, recordingSeconds || 4);
          }
        },
        onError: (err) => {
          console.warn('Voice recognition error:', err);
          setIsRecordingVoice(false);
        },
        onEnd: () => {
          setIsRecordingVoice(false);
        }
      });

      speechRecognitionRef.current = handle;
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setIsRecordingVoice(false);
    }
  };

  // Send a voice message
  const handleSendVoiceMessage = (spokenText: string, durationSec: number = 3) => {
    const durationFormatted = `0:${durationSec < 10 ? '0' + durationSec : durationSec}`;
    const userVoiceMsg: JhadimadiChatMessage = {
      id: `voice_${Date.now()}`,
      sender: 'user',
      text: spokenText,
      isVoice: true,
      voiceDuration: durationFormatted,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userVoiceMsg]);
    setIsRecordingVoice(false);
    processAiOrAdminResponse(spokenText);
  };

  // Send typed text message
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: JhadimadiChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    processAiOrAdminResponse(query);
  };

  // Process response from Gemini AI or Human Admin takeover
  const processAiOrAdminResponse = async (query: string) => {
    setIsLoading(true);

    // If query is requesting human admin
    if (query.includes('অ্যাডমিন') || query.includes('admin') || query.includes('কাস্টমার কেয়ার কর্মকর্তা')) {
      setTimeout(() => {
        setIsAdminMode(true);
        const adminWelcomeMsg: JhadimadiChatMessage = {
          id: `admin_${Date.now()}`,
          sender: 'admin',
          text: `👤 **ঝাদিমাদি অফিসিয়াল সাপোর্ট অফিসার (${adminName}) চ্যাটে যুক্ত হয়েছেন।**\n\nসম্মানিত গ্রাহক, আমি আপনার ইনকোয়ারি দেখতে পাচ্ছি। আপনার অর্ডার, পণ্য সংক্রান্ত যেকোনো প্রশ্ন, অথবা স্পেশাল ডেলিভারি সংক্রান্ত সহায়তা প্রয়োজন হলে অনুগ্রহ করে বিস্তারিত জানান।`,
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, adminWelcomeMsg]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const qLower = query.toLowerCase();

      // Quick helper to locate matching live products
      const findLiveProduct = (terms: string[]): StoreProduct | undefined => {
        return (liveProducts || []).find((p) => {
          if (!p) return false;
          const name = `${p.nameBn || ''} ${p.title_bn || ''} ${p.nameEn || ''}`.toLowerCase();
          return terms.some((t) => name.includes(t.toLowerCase()) || matchesSmartProduct(p, t));
        });
      };

      // 1. 'আপনাদের সেবা কী কী আছে?' OR 'আপনাদের সেবা সম্পর্কে বিস্তারিত বলুন'
      if (
        qLower.includes('সেবা কী কী') ||
        qLower.includes('সেবা কি কি') ||
        qLower.includes('সেবা সম্পর্কে বিস্তারিত') ||
        qLower.includes('আপনাদের সেবা')
      ) {
        const servicesMsg: JhadimadiChatMessage = {
          id: `srv_${Date.now()}`,
          sender: 'assistant',
          text: `🛠️ **ঝাদিমাদি (Jhadimadi.com) প্ল্যাটফর্মের মূল সেবাসমূহ:**\n\n` +
            `১. **পাহাড়ি খাঁটি অর্গানিক খাদ্যপণ্য:** পার্বত্য চট্টগ্রাম থেকে সরাসরি সংগৃহীত ১০০% বিশুদ্ধ পাহাড়ি সিদোল, শুটকি, জুমের হলুদ ও মরিচের গুঁড়া, খাঁটি জিরা মসলা, আদা ও বুনো পাহাড়ি মধু সরাসরি হোম ডেলিভারি।\n` +
            `২. **মিস্ত্রি ও হোম টেকনিশিয়ান সেবা:** বিদ্যুৎ ও ইলেকট্রিশিয়ান, প্লাম্বার ও পাইপলাইন, এসি/ফ্রিজ মেকানিক, রাজমিস্ত্রি, কাঠমিস্ত্রি এবং পেইন্টার সেবা বুকিং।\n` +
            `৩. **জরুরি রক্তদাতা নেটওয়ার্ক:** যেকোনো রক্তের প্রয়োজনে স্থানীয় ভেরিফাইড রক্তদাতাদের সঙ্গে দ্রুত সংযোগ স্থাপন।\n` +
            `৪. **পাহাড়ের ট্যুর ও পরিবহন:** চাঁদের গাড়ি, সাজেক ও পাহাড়ি পর্যটন রিসোর্ট তথ্য ও বুকিং সহায়তা।\n\n` +
            `📦 **ডেলিভারি ও পেমেন্ট:** সারা বাংলাদেশে নিরাপদ ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)।\n` +
            `📞 সরাসরি হেল্পলাইন/WhatsApp: 01870592699`,
          quickReplyChips: ['আপনাদের পণ্যের লিস্ট দিন', 'ঝাদিমাদি সিদোল-এর দাম কত?', 'ঝাদিমাদি কী?'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, servicesMsg]);
        setIsLoading(false);
        return;
      }

      // 2. 'আপনাদের পণ্যের লিস্ট দিন'
      if (qLower.includes('পণ্যের লিস্ট') || qLower.includes('পণ্যের তালিকা') || qLower.includes('পণ্য তালিকা')) {
        const activeList = (liveProducts || []).filter((p) => p && p.isPublished !== false);
        let listText = `🛍️ **ঝাদিমাদি পাহাড়ি অর্গানিক পণ্যের সম্ভার:**\n\n`;
        
        if (activeList.length > 0) {
          activeList.slice(0, 8).forEach((p, idx) => {
            const discountInfo = p.discount_price ? ` (অফার মূল্য: ৳${p.discount_price})` : '';
            listText += `${idx + 1}. **${p.nameBn}** - ৳${p.price} / ${p.unit || '১ প্যাক'}${discountInfo}\n`;
          });
          listText += `\n✨ যেকোনো পণ্য কিনতে নিচে সরাসরি "অর্ডার করুন" বা "কার্টে যোগ করুন" বাটনে ক্লিক করুন।`;
        } else {
          listText += `১. **ঝাদিমাদি খাঁটি পাহাড়ি সিদোল (Sidol)** - ৳৩৫০ / ৫০০ গ্রাম\n` +
            `২. **পাহাড়ি জুমের হলুদের গুড়া (Turmeric)** - ৳২৮০ / ৫০০ গ্রাম\n` +
            `৩. **প্রাকৃতিক পাহাড়ি শুটকি (Dried Fish)** - ৳৪৫০ / ৫০০ গ্রাম\n` +
            `৪. **স্পেশাল পাহাড়ি জিরা মসলা (Cumin)** - ৳৩২০ / ৫০০ গ্রাম\n` +
            `৫. **জুমের পাহাড়ি মরিচের গুড়া (Chili)** - ৳৩০০ / ৫০০ গ্রাম\n` +
            `৬. **পাহাড়ি বুনো মধু (Wild Honey)** - ৳৮৫০ / ১ কেজি\n\n` +
            `✨ সকল পণ্য ১০০% কেমিক্যাল ও প্রিজারভেটিভমুক্ত। ক্যাশ অন ডেলিভারি সুবিধা রয়েছে!`;
        }

        const productsToAdd = activeList.slice(0, 4).map((p) => ({
          id: p.id,
          name: `${p.nameBn} (${p.unit || ''})`.trim(),
          price: `৳ ${p.price}`,
          category: p.categoryLabelBn || p.category,
          image: p.image || (Array.isArray(p.images) && p.images[0]),
        }));

        const listMsg: JhadimadiChatMessage = {
          id: `prod_list_${Date.now()}`,
          sender: 'assistant',
          text: listText,
          recommendedProducts: productsToAdd,
          quickReplyChips: ['ঝাদিমাদি সিদোল-এর দাম কত?', 'ঝাদিমাদি হলুদের গুড়ার দাম কত?', 'ঝাদিমাদি শুটকির দাম কত?'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, listMsg]);
        setIsLoading(false);
        return;
      }

      // 3. 'ঝাদিমাদি কী?'
      if (qLower.includes('ঝাদিমাদি কী') || qLower.includes('ঝাদিমাদি কি') || qLower.includes('jhadimadi ki')) {
        const whatIsMsg: JhadimadiChatMessage = {
          id: `what_${Date.now()}`,
          sender: 'assistant',
          text: `🌿 **ঝাদিমাদি (Jhadimadi.com) কী?**\n\n` +
            `ঝাদিমাদি হলো পার্বত্য চট্টগ্রামের (খাগড়াছড়ি, রাঙ্গামাটি ও বান্দরবান) ঐতিহ্যবাহী প্রাকৃতিক, শতভাগ কেমিক্যালমুক্ত খাদ্যপণ্য এবং পাহাড়ের প্রান্তিক দক্ষ জনশক্তির এক বিশ্বস্ত ডিজিটাল ইকোসিস্টেম।\n\n` +
            `🎯 **আমাদের লক্ষ্য ও বিশেষত্ব:**\n` +
            `• পাহাড়ি আদিবাসী ও ক্ষুদ্র কৃষকদের উৎপাদিত খাঁটি জুমের ফসল (সিদোল, পাহাড়ি মসলা, শুটকি, মধু) কোনো মধ্যস্বত্বভোগী ছাড়া সরাসরি দেশের মানুষের কাছে পৌঁছে দেওয়া।\n` +
            `• স্থানীয় দক্ষ পেশাজীবী (মিস্ত্রি, টেকনিশিয়ান, কারিগর)-দের সরাসরি কর্মসংস্থান ও প্ল্যাটফর্ম প্রদান।\n` +
            `• জরুরি রক্তের সন্ধান ও পাহাড়ি জনকল্যাণমূলক নাগরিক সহায়তা প্রদান।\n\n` +
            `“ঝাদিমাদি — পাহাড়ি মাটির খাঁটি সুবাস ও নির্ভরযোগ্য ডিজিটাল সেবা।”`,
          quickReplyChips: ['আপনাদের সেবা কী কী আছে?', 'আপনাদের পণ্যের লিস্ট দিন', 'ঝাদিমাদি সিদোল-এর দাম কত?'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, whatIsMsg]);
        setIsLoading(false);
        return;
      }

      // 4. 'ঝাদিমাদি সিদোল-এর দাম কত?'
      if (/সিদোল|সিদল|সেদল|সিঁদল|হিদল|হিদোল|sidal|sidol/i.test(qLower) && (qLower.includes('দাম') || qLower.includes('রেট') || qLower.includes('কত') || qLower.includes('মূল্য'))) {
        const match = findLiveProduct(['সিদোল', 'সিদল', 'সেদল', 'সিঁদল', 'হিদল', 'sidal', 'sidol']);
        const price = match ? match.price : 500;
        const unit = match?.unit || '৫০০ গ্রাম';
        const discountText = match?.discount_price ? `\n• বিশেষ অফার মূল্য: ৳${match.discount_price}` : '';

        const sidolMsg: JhadimadiChatMessage = {
          id: `sidol_${Date.now()}`,
          sender: 'assistant',
          text: `🐟 **ঝাদিমাদি পাহাড়ি খাঁটি সিদোল (Traditional Hill Sidol):**\n\n` +
            `• বর্তমান দাম: ৳${price} (${unit})${discountText}\n` +
            `• উৎপাদন ও বৈশিষ্ট্য: পার্বত্য চট্টগ্রামের ঐতিহ্যবাহী উপজাতীয় রেসিপিতে সম্পূর্ণ প্রাকৃতিক উপায়ে তৈরি। কোনো রাসায়নিক কীটনাশক বা প্রিজারভেটিভ নেই।\n` +
            `• স্বাদ ও ঘ্রাণ: পাহাড়ি ঐতিহ্যবাহী সিদোলের খাঁটি সুবাস ও অতুলনীয় স্বাদ।\n\n` +
            `অর্ডার করতে নিচের কার্ড থেকে সরাসরি "অর্ডার করুন" বা "কার্টে যোগ করুন" বাটনে ক্লিক করুন।`,
          recommendedProducts: match ? [{
            id: match.id,
            name: `${match.nameBn} (${match.unit || ''})`.trim(),
            price: `৳ ${match.price}`,
            category: match.categoryLabelBn || match.category,
            image: match.image || (Array.isArray(match.images) && match.images[0]),
          }] : [],
          quickReplyChips: ['ঝাদিমাদি শুটকির দাম কত?', 'ঝাদিমাদি হলুদের গুড়ার দাম কত?', 'সরাসরি অর্ডার করতে চাই'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, sidolMsg]);
        setIsLoading(false);
        return;
      }

      // 5. 'ঝাদিমাদি হলুদের গুড়ার দাম কত?'
      if (qLower.includes('হলুদ') && (qLower.includes('দাম') || qLower.includes('রেট') || qLower.includes('কত'))) {
        const match = findLiveProduct(['হলুদ', 'turmeric']);
        const price = match ? match.price : 280;
        const unit = match?.unit || '৫০০ গ্রাম';
        const discountText = match?.discount_price ? `\n• বিশেষ অফার মূল্য: ৳${match.discount_price}` : '';

        const turmericMsg: JhadimadiChatMessage = {
          id: `turmeric_${Date.now()}`,
          sender: 'assistant',
          text: `🌿 **ঝাদিমাদি খাঁটি পাহাড়ি হলুদের গুঁড়া (Hill Turmeric Powder):**\n\n` +
            `• বর্তমান দাম: ৳${price} (${unit})${discountText}\n` +
            `• বৈশিষ্ট্য: পাহাড়ের জুমের পাহাড়ি জাতের কাঁচা হলুদ স্বাস্থ্যসম্মতভাবে রোদে শুকিয়ে নিজস্ব মিলে ভাঙানো। শতভাগ নির্ভেজাল, প্রাকৃতিক উজ্জ্বল হলুদ রঙ ও তীব্র পাহাড়ি সুবাস।\n` +
            `• কোয়ালিটি: কোনো কৃত্রিম রঙ বা ক্ষতিকর উপাদান নেই।\n\n` +
            `আপনি চাইলে নিচের পণ্য কার্ড থেকে এখনই অর্ডার করতে পারেন।`,
          recommendedProducts: match ? [{
            id: match.id,
            name: `${match.nameBn} (${match.unit || ''})`.trim(),
            price: `৳ ${match.price}`,
            category: match.categoryLabelBn || match.category,
            image: match.image || (Array.isArray(match.images) && match.images[0]),
          }] : [],
          quickReplyChips: ['ঝাদিমাদি মরিচের গুড়ার দাম কত?', 'ঝাদিমাদি জিরা মসলার দাম কত?', 'অন্যান্য পণ্য'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, turmericMsg]);
        setIsLoading(false);
        return;
      }

      // 6. 'ঝাদিমাদি শুটকির দাম কত?'
      if ((/শুটকি|শুঁটকি|চুটকি|শুটাক|সুটকি|shutki/i.test(qLower)) && (qLower.includes('দাম') || qLower.includes('রেট') || qLower.includes('কত') || qLower.includes('মূল্য'))) {
        const match = findLiveProduct(['শুটকি', 'শুঁটকি', 'চুটকি', 'শুটাক', 'সুটকি', 'shutki']);
        const price = match ? match.price : 450;
        const unit = match?.unit || '৫০০ গ্রাম';
        const discountText = match?.discount_price ? `\n• বিশেষ অফার মূল্য: ৳${match.discount_price}` : '';

        const shutkiMsg: JhadimadiChatMessage = {
          id: `shutki_${Date.now()}`,
          sender: 'assistant',
          text: `🐟 **ঝাদিমাদি প্রাকৃতিক পাহাড়ি শুটকি (Hill Dried Fish):**\n\n` +
            `• বর্তমান দাম: ৳${price} (${unit})${discountText}\n` +
            `• বৈশিষ্ট্য: কীটনাশক ও রাসায়নিক প্রিজারভেটিভ ছাড়া পাহাড়ের নির্মল হাওয়া ও রোদে শুকানো শতভাগ নিরাপদ পাহাড়ি শুটকি।\n` +
            `• স্বাস্থ্যকর প্যাকেজিং: ধুলোবালি ও মাছিমুক্ত এয়ারটাইট প্যাকেটে সংরক্ষিত।\n\n` +
            `অর্ডার করতে নিচের বাটনে চাপুন বা ডেলিভারি ঠিকানা জানান।`,
          recommendedProducts: match ? [{
            id: match.id,
            name: `${match.nameBn} (${match.unit || ''})`.trim(),
            price: `৳ ${match.price}`,
            category: match.categoryLabelBn || match.category,
            image: match.image || (Array.isArray(match.images) && match.images[0]),
          }] : [],
          quickReplyChips: ['ঝাদিমাদি সিদোল-এর দাম কত?', 'ঝাদিমাদি মরিচের গুড়ার দাম কত?', 'পেমেন্ট ও ডেলিভারি'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, shutkiMsg]);
        setIsLoading(false);
        return;
      }

      // 7. 'ঝাদিমাদি জিরা মসলার দাম কত?'
      if (qLower.includes('জিরা') && (qLower.includes('দাম') || qLower.includes('রেট') || qLower.includes('কত') || qLower.includes('মসলা'))) {
        const match = findLiveProduct(['জিরা', 'jira', 'cumin']);
        const price = match ? match.price : 320;
        const unit = match?.unit || '৫০০ গ্রাম';
        const discountText = match?.discount_price ? `\n• বিশেষ অফার মূল্য: ৳${match.discount_price}` : '';

        const cuminMsg: JhadimadiChatMessage = {
          id: `cumin_${Date.now()}`,
          sender: 'assistant',
          text: `🌿 **ঝাদিমাদি স্পেশাল খাঁটি জিরা মসলা (Special Cumin Powder):**\n\n` +
            `• বর্তমান দাম: ৳${price} (${unit})${discountText}\n` +
            `• বৈশিষ্ট্য: প্রিমিয়াম গ্রেডের বাছাইকৃত আস্ত জিরা ধুয়ে শুকিয়ে সুগন্ধযুক্তভাবে গুঁড়া করা। রান্নায় আনে অপূর্ব প্রাকৃতিক ঘ্রাণ ও স্বাদ। শতভাগ খাঁটি ও ভেজালমুক্ত।\n\n` +
            `নিচের কার্ড থেকে সরাসরি আপনার অর্ডারে যোগ করুন।`,
          recommendedProducts: match ? [{
            id: match.id,
            name: `${match.nameBn} (${match.unit || ''})`.trim(),
            price: `৳ ${match.price}`,
            category: match.categoryLabelBn || match.category,
            image: match.image || (Array.isArray(match.images) && match.images[0]),
          }] : [],
          quickReplyChips: ['ঝাদিমাদি হলুদের গুড়ার দাম কত?', 'ঝাদিমাদি মরিচের গুড়ার দাম কত?', 'পণ্য অর্ডার করুন'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, cuminMsg]);
        setIsLoading(false);
        return;
      }

      // 8. 'ঝাদিমাদি মরিচের গুড়ার দাম কত?'
      if (qLower.includes('মরিচ') && (qLower.includes('দাম') || qLower.includes('রেট') || qLower.includes('কত'))) {
        const match = findLiveProduct(['মরিচ', 'chili', 'morich']);
        const price = match ? match.price : 300;
        const unit = match?.unit || '৫০০ গ্রাম';
        const discountText = match?.discount_price ? `\n• বিশেষ অফার মূল্য: ৳${match.discount_price}` : '';

        const chiliMsg: JhadimadiChatMessage = {
          id: `chili_${Date.now()}`,
          sender: 'assistant',
          text: `🌶️ **ঝাদিমাদি খাঁটি পাহাড়ি মরিচের গুঁড়া (Hill Chili Powder):**\n\n` +
          `• বর্তমান দাম: ৳${price} (${unit})${discountText}\n` +
          `• বৈশিষ্ট্য: পার্বত্য অঞ্চলের জুম পাহাড়ে চাষকৃত তীব্র ঝাল ও গাঢ় লাল রঙের মরিচ থেকে তৈরি। এতে কোনো কৃত্রিম রঙ, ডাস্ট বা ভেজাল নেই।\n` +
          `• মান: ল্যাব টেস্টেড ও শতভাগ খাঁটি।\n\n` +
          `অর্ডার করতে নিচের কার্ড থেকে "কার্টে যোগ করুন" বাটনে চাপুন।`,
          recommendedProducts: match ? [{
            id: match.id,
            name: `${match.nameBn} (${match.unit || ''})`.trim(),
            price: `৳ ${match.price}`,
            category: match.categoryLabelBn || match.category,
            image: match.image || (Array.isArray(match.images) && match.images[0]),
          }] : [],
          quickReplyChips: ['ঝাদিমাদি হলুদের গুড়ার দাম কত?', 'ঝাদিমাদি জিরা মসলার দাম কত?', 'কার্টে যোগ করুন'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, chiliMsg]);
        setIsLoading(false);
        return;
      }

      // Check if user query has search intent (finding products, services, blood donors, members, jobs, etc.)
      const isBloodQuery = /রক্ত|ব্লাড|blood|donor|ডোনার|\b(?:a|b|ab|o)[+-]\b|পজিটিভ|পজেটিভ|নেগেটিভ/i.test(qLower);
      const isServiceQuery = /ইলেকট্রিশিয়ান|ইলেকট্রিক|বিদ্যুৎ|মিস্ত্রি|কারেন্ট|প্লাম্বার|পেইন্টার|রংমিস্ত্রি|মেকানিক|শিক্ষক|টিউটর|টিচার|ডাক্তার|চিকিৎসক|নার্স|রাজমিস্ত্রি|ড্রাইভার|সার্ভিস|সেবা|service|painter/i.test(qLower);
      const isMemberQuery = /প্রতিনিধি|সদস্য|মেম্বার|কমিটি|ম্যানেজার|কো-অর্ডিনেটর|লিডার|স্থায়ী সদস্য|স্থায়ী সদস্য|representative|member/i.test(qLower);
      const isJobQuery = /চাকরি|সার্কুলার|নিয়োগ|কাজের সুযোগ|সিভি|বায়োডাটা|বায়োডাটা|কর্মসন্ধানী|job/i.test(qLower);
      const isProductQuery = /পণ্য|আম|আম্রপালি|হিমসাগর|কাঁঠাল|হলুদ|আদা|ফসল|পাইকারি|জমি|প্লট|বাগান|মরিচ|মধু|চা|চাল|সিদোল|সিদল|সেদল|সিঁদল|হিদল|হিদোল|শুটকি|শুঁটকি|চুটকি|শুটাক|সুটকি|sidol|sidal|shutki|তেল|দাম|রেট|বাজেট|order|অর্ডার|কিনব|কিনতে চাই/i.test(qLower);
      const isExplicitSearch = /দরকার|খুঁজছি|চাই|লাগবে|পাওয়া যাবে|কোথায়/i.test(qLower);

      const hasSearchIntent = isBloodQuery || isServiceQuery || isMemberQuery || isJobQuery || isProductQuery || isExplicitSearch;

      if (hasSearchIntent) {
        // Query the Intelligent Search Engine endpoint with natural language query
        const userLoc = currentUser?.upazila || currentUser?.district || 'পার্বত্য চট্টগ্রাম';
        const searchRes = await smartSearchGemini(query, userLoc);

        const isMatched = Boolean(searchRes.hasRealMatches && searchRes.realResults && searchRes.realResults.length > 0);

        let actionLink: GeminiActionLink | undefined;
        if (searchRes.matchType === 'blood') {
          actionLink = { type: 'blood', label: 'রক্তদাতা তালিকা দেখুন' };
        }

        let productsToAdd: GeminiProductRecommendation[] = [];
        if (searchRes.matchType === 'product' && Array.isArray(searchRes.realResults)) {
          productsToAdd = searchRes.realResults.map((p: any) => ({
            id: p.id,
            name: `${p.nameBn} (${p.unit || ''})`.trim(),
            price: `৳ ${p.price}`,
            category: p.categoryLabelBn || p.category,
            image: p.image || (Array.isArray(p.images) && p.images[0]),
          }));
        }

        const botReplyMsg: JhadimadiChatMessage = {
          id: `search_${Date.now()}`,
          sender: 'assistant',
          text: searchRes.explanation || (isMatched ? 'ডাটাবেজ থেকে যাচাইকৃত ফলাফল পাওয়া গেছে:' : 'দুঃখিত, কোনো তথ্য পাওয়া যায়নি।'),
          recommendedProducts: productsToAdd,
          actionLink,
          preliminaryNotice: searchRes.preliminaryNotice,
          clarificationNeeded: searchRes.clarificationNeeded,
          clarificationQuestion: searchRes.clarificationQuestion,
          clarificationChips: searchRes.clarificationChips,
          searchResultData: {
            matchType: searchRes.matchType || 'service',
            hasRealMatches: isMatched,
            explanation: searchRes.explanation,
            preliminaryNotice: searchRes.preliminaryNotice,
            clarificationNeeded: searchRes.clarificationNeeded,
            clarificationQuestion: searchRes.clarificationQuestion,
            clarificationChips: searchRes.clarificationChips,
            structuredIntent: searchRes.structuredIntent,
            items: searchRes.realResults || [],
          },
          quickReplyChips: searchRes.clarificationChips && searchRes.clarificationChips.length > 0
            ? searchRes.clarificationChips
            : (searchRes.tags && searchRes.tags.length > 0 ? searchRes.tags : ['অন্যান্য পণ্য', 'মিস্ত্রি সেবা', 'সহায়তা কল']),
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, botReplyMsg]);
        setIsLoading(false);
        return;
      }

      const history = messages.slice(-5).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const response = await askGeminiSupportChat(
        query,
        history,
        {
          userName: currentUser?.name,
          phone: currentUser?.phone,
          location: currentUser?.upazila || currentUser?.district || 'Khagrachari',
          gender: currentUser?.gender,
          userId: currentUser?.id,
        },
        liveProducts,
        livePosts,
        liveUsers
      );

      // Match products dynamically from active liveProducts feed
      let productsToAdd = response.recommendedProducts || [];

      // STRICT: For general greetings, casual chat, or blood/services/members queries, NEVER attach unrelated product cards
      const isGreeting = /^(হ্যালো|হাই|সালাম|আসসালামু|নমস্কার|কেমন আছেন|hello|hi|hey|kemon achen)/i.test(qLower) || 
                         qLower === 'হ্যালো' || qLower === 'হাই' || qLower === 'কেমন আছেন';

      if (isGreeting || isBloodQuery || isServiceQuery || isMemberQuery) {
        productsToAdd = [];
      } else if (!productsToAdd || productsToAdd.length === 0) {
        const tokens = qLower.split(/[\s,./?!+-]+/).filter((t) => t.length >= 2);
        const matched = (liveProducts || []).filter((p) => {
          if (p.isPublished === false) return false;
          const nameBn = (p.nameBn || '').toLowerCase();
          const nameEn = (p.nameEn || '').toLowerCase();
          const code = (p.code || '').toLowerCase();
          const origin = (p.origin || p.productionOrigin || '').toLowerCase();
          const district = ((p as any).district || '').toLowerCase();
          const upazila = ((p as any).upazila || '').toLowerCase();

          if (code && (qLower === code || qLower.includes(code))) return true;
          if (nameBn.includes(qLower) || nameEn.includes(qLower)) return true;
          if ((qLower.includes('কাঁঠাল') || qLower.includes('কাঠাল') || qLower.includes('jackfruit')) && (nameBn.includes('কাঁঠাল') || nameBn.includes('কাঠাল') || nameEn.includes('jackfruit'))) return true;
          if ((qLower.includes('আলু') || qLower.includes('potato')) && (nameBn.includes('আলু') || nameEn.includes('potato'))) return true;
          if (qLower.includes('মরিচ') && (nameBn.includes('মরিচ') || nameEn.includes('chili'))) return true;
          if (qLower.includes('হলুদ') && (nameBn.includes('হলুদ') || nameEn.includes('turmeric'))) return true;
          if ((qLower.includes('শুঁটকি') || qLower.includes('শুটকি') || qLower.includes('চিংড়ি')) && (nameBn.includes('শুঁটকি') || nameBn.includes('শুটকি') || nameBn.includes('চিংড়ি'))) return true;
          if ((qLower.includes('মধু') || qLower.includes('দুধ')) && (nameBn.includes('মধু') || nameBn.includes('দুধ'))) return true;
          if ((qLower.includes('চাল') || qLower.includes('বিনি') || qLower.includes('জুম')) && (nameBn.includes('চাল') || nameBn.includes('বিনি') || nameBn.includes('জুম'))) return true;
          if ((qLower.includes('আম') || qLower.includes('mango')) && (nameBn.includes('আম') || nameEn.includes('mango'))) return true;
          if ((qLower.includes('আদা') || qLower.includes('ginger')) && (nameBn.includes('আদা') || nameEn.includes('ginger'))) return true;
          if ((qLower.includes('রসুন') || qLower.includes('garlic')) && (nameBn.includes('রসুন') || nameEn.includes('garlic'))) return true;

          return tokens.some((t) => nameBn.includes(t) || nameEn.includes(t) || origin.includes(t) || district.includes(t) || upazila.includes(t));
        });

        if (matched.length > 0) {
          productsToAdd = matched.slice(0, 3).map((p) => ({
            id: p.id,
            name: `${p.nameBn} (${p.unit || ''})`.trim(),
            price: `৳ ${p.price}`,
            category: p.categoryLabelBn || p.category,
            image: p.image || (Array.isArray(p.images) && p.images[0]),
          }));
        }
      }

      // Check if service info is needed
      let serviceInfo: JhadimadiChatMessage['serviceInfo'] | undefined;
      if (query.includes('সেবা') || query.includes('সার্ভিস') || query.includes('service') || query.includes('ডাক্তার') || query.includes('টিকিট')) {
        serviceInfo = {
          title: 'ঝাদিমাতি ডটকম অফিসিয়াল সেবা সমূহ',
          rate: 'বাজার সদাই, টিকিট, ডাক্তার সিরিয়াল, হোম সার্ভিস ও অন্যান্য',
          deliveryTime: 'অফিসিয়াল হেল্পলাইন ও সাপোর্ট',
          category: 'সার্ভিস প্ল্যাটফর্ম',
        };
      }

      // Extract order if present
      let extractedOrder = response.orderData;
      const rawText = (lang === 'bn' ? response.replyBn : response.replyEn) || response.replyBn;
      
      // Parse structured JSON order if present in response or raw text
      if (!extractedOrder || !extractedOrder.order_status) {
        if (rawText.includes('"order_status": "confirmed"') || rawText.includes('"order_status":"confirmed"')) {
          try {
            const match = rawText.match(/\{[\s\S]*?"order_status"\s*:\s*"confirmed"[\s\S]*?\}/);
            if (match) {
              extractedOrder = JSON.parse(match[0]);
            }
          } catch (e) {
            console.warn('Order JSON parse error:', e);
          }
        }
      }

      if (!extractedOrder && rawText.includes('"is_order": true')) {
        try {
          const match = rawText.match(/\{\s*"is_order"\s*:\s*true[\s\S]*?\}/);
          if (match) {
            extractedOrder = JSON.parse(match[0]);
          }
        } catch (e) {
          console.warn('Order JSON parse error:', e);
        }
      }

      const isOrder = Boolean(
        response.is_order ||
        response.order_status === 'confirmed' ||
        extractedOrder?.order_status === 'confirmed' ||
        extractedOrder?.is_order
      );

      // Proactively notify backend of confirmed order
      if (isOrder && extractedOrder) {
        fetch('/api/orders/ai-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: extractedOrder.customer_name || currentUser?.name,
            phone: extractedOrder.phone || currentUser?.phone,
            delivery_address: extractedOrder.delivery_address || extractedOrder.address,
            items: extractedOrder.items || (extractedOrder.product ? [{ product_name: extractedOrder.product, quantity: 1 }] : []),
            source: 'ai_chatbot',
            raw_notes: rawText
          })
        }).catch(err => console.warn('ai-confirm dispatch notice:', err));
      }

      const botReplyMsg: JhadimadiChatMessage = {
        id: `bot_${Date.now()}`,
        sender: isAdminMode ? 'admin' : 'assistant',
        text: rawText,
        isOrder,
        orderData: extractedOrder,
        recommendedProducts: isBloodQuery ? [] : productsToAdd,
        actionLink: response.actionLink,
        quickReplyChips: response.clarificationChips && response.clarificationChips.length > 0
          ? response.clarificationChips
          : response.quickReplyChips,
        preliminaryNotice: response.preliminaryNotice,
        clarificationNeeded: response.clarificationNeeded,
        clarificationQuestion: response.clarificationQuestion,
        clarificationChips: response.clarificationChips,
        serviceInfo,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReplyMsg]);
      // Per Rule 3: Text-only by default (no automated TTS output on message arrival)
    } catch (err) {
      console.warn('AI Chat Error:', err);
      const fallbackMsg: JhadimadiChatMessage = {
        id: `fb_${Date.now()}`,
        sender: 'assistant',
        text: 'এই তথ্যটি বর্তমানে Jhadimadi-এর তথ্যভাণ্ডারে পাওয়া যাচ্ছে না।\n\nসঠিক তথ্যের জন্য অনুগ্রহ করে আমাদের হেল্পলাইনে অথবা অফিসিয়াল ইমেইলে (jhadimadi2024@gmail.com) যোগাযোগ করুন।',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick inquiry chips based dynamically on active live products, order requests, and official services
  const dynamicLiveChips = (liveProducts || [])
    .filter((p) => p && p.isPublished !== false && p.nameBn)
    .slice(0, 5)
    .map((p) => ({
      label: `🛍️ ${p.nameBn.split(' ')[0] || p.nameBn}`,
      text: `${p.nameBn} (${p.unit || ''}) এর বর্তমান দাম, ছবি ও বিস্তারিত কত?`,
    }));

  const standardChips = [
    { label: '🛒 সরাসরি অর্ডার দিতে চাই', text: 'আমি ঝাদিমাদি ডটকম থেকে পণ্য সরাসরি অর্ডার করতে চাই।' },
    { label: '🛠️ মিস্ত্রি ও সেবা বুকিং', text: 'বাসা ও অফিসের কাজের জন্য দক্ষ মিস্ত্রি বা টেকনিশিয়ান সেবা সম্পর্কে জানতে চাই।' },
    { label: '💼 চাকরির বিজ্ঞপ্তি', text: 'ঝাদিমাদিতে চাকরির নতুন কী কী বিজ্ঞপ্তি বা ক্যারিয়ার সুযোগ রয়েছে?' },
    { label: '🩸 রক্তদাতা ও জরুরি সেবা', text: 'জরুরি রক্তদাতা ও হেল্পলাইনের তথ্য জানতে চাই।' },
    { label: '✨ প্ল্যাটফর্মে যোগ দিন', text: 'ঝাদিমাদিতে বিক্রেতা বা সেবাদাতা হিসেবে যোগ দেওয়ার নিয়ম কী?' },
    { label: '🚚 পেমেন্ট ও ডেলিভারি', text: 'পেমেন্ট ও ডেলিভারি তথ্য কী?' },
    { label: '📞 কন্টাক্ট ইনফো', text: 'ঝাদিমাদি ডটকমের যোগাযোগের ঠিকানা ও WhatsApp নম্বর কী?' },
  ];

  const quickInquiries = [...dynamicLiveChips, ...standardChips];

  // Horizontally scrollable quick prompt chips explicitly requested
  const quickPromptPills = [
    'আপনাদের সেবা কী কী আছে?',
    'আপনাদের পণ্যের লিস্ট দিন',
    'ঝাদিমাদি কী?',
    'ঝাদিমাদি সিদোল-এর দাম কত?',
    'ঝাদিমাদি হলুদের গুড়ার দাম কত?',
    'ঝাদিমাদি শুটকির দাম কত?',
    'ঝাদিমাদি জিরা মসলার দাম কত?',
    'ঝাদিমাদি মরিচের গুড়ার দাম কত?',
    'আপনাদের সেবা সম্পর্কে বিস্তারিত বলুন',
  ];

  // Helper to find store product for cart/checkout
  const getMatchedProduct = (rec: GeminiProductRecommendation): StoreProduct => {
    const found = liveProducts.find(
      (p) => p.id === rec.id || p.nameBn.includes(rec.name) || rec.name.includes(p.nameBn)
    );
    if (found) return found;

    return {
      id: rec.id || `chat_prod_${Date.now()}`,
      nameBn: rec.name,
      nameEn: rec.name,
      category: (rec.category as any) || 'CraftsHoney',
      categoryLabelBn: 'পাহাড়ি খাঁটি পণ্য',
      price: parseInt(rec.price?.replace(/[^0-9]/g, '') || '1200', 10),
      originalPrice: parseInt(rec.price?.replace(/[^0-9]/g, '') || '1200', 10) + 150,
      unit: '১ প্যাকেট',
      origin: 'খাগড়াছড়ি',
      image: rec.image || '/assets/images/logo.png',
      rating: 5.0,
      reviewsCount: 1,
      stock: 25,
      descriptionBn: (rec as any).description || 'ঝাদিমাদি অনুমোদিত খাঁটি পাহাড়ি প্রাকৃতিক পণ্য।',
      descriptionEn: (rec as any).description || 'Authentic organic hill product certified by Jhadimadi.',
      features: ['শতভাগ বিশুদ্ধ', 'সরাসরি পাহাড়ের খামার থেকে সংগৃহীত', 'ক্যাশ অন ডেলিভারি'],
    };
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="jhadimadi-ai-chat-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Messaging Modal Container (Increased width for comfortable layout on mobile & desktop) */}
      <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-full sm:h-[95vh] sm:max-h-[900px] bg-[#FBF9F5] flex flex-col overflow-hidden shadow-2xl sm:rounded-3xl border border-stone-300/80 relative">
        
        {/* ================= 1. UNIVERSAL TOP HEADER (Left-Logo & Right-Language) ================= */}
        <div 
          className="w-full bg-[#FBF9F5] pt-2 sm:pt-2.5 pb-2 px-2.5 sm:px-4 shrink-0 border-b border-emerald-600/20 shadow-2xs"
          id="chat-modal-universal-header"
        >
          {/* Universal Top Header Container Box: Solid Off-White Fill inside Green Outline Border */}
          <div 
            className="w-full border border-emerald-600 rounded-xl px-2 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 bg-[#faf9f6] shadow-xs"
            style={{ backgroundColor: '#faf9f6' }}
          >
            {/* Left Side: Back Arrow + Jhadimadi Runner Logo & Dual Text aligned to Far-Left */}
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1 sm:p-1.5 rounded-lg bg-transparent hover:bg-emerald-50 active:scale-95 text-[#16a34a] transition flex items-center justify-center border border-emerald-600 shadow-2xs cursor-pointer mr-0.5 shrink-0"
                title={lang === 'en' ? 'Back' : 'পেছনে যান'}
                aria-label={lang === 'en' ? 'Back' : 'পেছনে যান'}
                id="btn-chat-navbar-back"
              >
                <ArrowLeft className="w-4 h-4 text-[#16a34a]" />
              </button>

              <div 
                onClick={onClose}
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group shrink-0 min-w-0"
                title="JHADIMADI.COM"
                id="chat-navbar-brand-logo-trigger"
              >
                <div className="relative p-0.5 rounded-lg bg-transparent shadow-xs border border-emerald-600 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                  <img 
                    src="https://i.ibb.co.com/sppWZhc9/logo33.png"
                    alt="Jhadimadi Runner"
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/runner-logo.png";
                    }}
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-baseline gap-0.5 leading-none">
                    <span className="text-sm sm:text-base font-black tracking-wide text-slate-900 drop-shadow-2xs">JHADIMADI</span>
                    <span className="text-xs sm:text-sm font-black text-[#16a34a]">.COM</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 tracking-normal leading-tight block mt-0.5">
                    ঝাদিমাদি ডটকম
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Language Switcher (EN / BN) at the far RIGHT corner & Close button */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {setLang && (
                <button
                  type="button"
                  onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
                  className="h-7 px-2 rounded-lg bg-transparent hover:bg-emerald-50/50 active:scale-95 text-[#16a34a] transition flex items-center gap-1 border border-emerald-600 shadow-2xs cursor-pointer shrink-0"
                  title={lang === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
                  aria-label={lang === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
                  id="btn-chat-header-lang-toggle"
                >
                  <Languages className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                  <span className="text-[9.5px] sm:text-[10.5px] font-black tracking-tight whitespace-nowrap text-[#16a34a]">
                    {lang === 'en' ? 'বাংলা' : 'EN'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="h-7 w-7 rounded-lg bg-transparent hover:bg-rose-50 active:scale-95 text-stone-600 hover:text-rose-600 transition flex items-center justify-center border border-stone-300 hover:border-rose-400 shadow-2xs cursor-pointer shrink-0"
                title="চ্যাট বন্ধ করুন (Close)"
                aria-label="চ্যাট বন্ধ করুন (Close)"
                id="btn-chat-top-close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Centered Bold Tagline directly below */}
          <p className="text-center font-bold text-stone-800 text-xs sm:text-sm mt-1.5 sm:mt-2 leading-snug">
            {lang === 'bn' ? 'আপনার সকল প্রয়োজনের কথা আমাকে বলুন।' : 'Tell me what you need, I am here to help.'}
          </p>
        </div>

        {/* ================= 2. CHAT CANVAS (DIGITAL PAPER / BOOK-PAGE TEXTURE #FBF9F5) ================= */}
        <div 
          className="flex-1 overflow-y-auto px-3 sm:px-5 md:px-6 py-4 space-y-4 relative bg-[#FBF9F5]"
        >
          {/* Date separator pill styled like a book bookmark */}
          <div className="flex justify-center my-1">
            <span className="bg-[#ede8db] text-[#15803d] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-2xs border border-[#15803d]/20">
              📖 পৃষ্ঠা: আজ (Today)
            </span>
          </div>

          {/* Message Stream */}
          {messages.map((msg) => {
            const isMe = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-150`}
              >
                {/* Message Bubble Container */}
                <div className={`flex items-end gap-1.5 max-w-[88%] sm:max-w-[82%]`}>
                  
                  {/* Left Avatar for Assistant or Admin */}
                  {!isMe && (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-xs border ${msg.sender === 'admin' ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-[#009f4d] text-white border-white'}`}>
                      {msg.sender === 'admin' ? (
                        <Headphones className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  {/* Bubble Content (Digital Paper / Book-page aesthetic with 18px minimum body text and relaxed line spacing) */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl leading-relaxed shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative transition-all duration-300 ease-out transform-gpu ${
                      isMe
                        ? 'bg-[#15803d] text-[#FBF9F5] rounded-br-xs font-normal'
                        : msg.sender === 'admin'
                        ? 'bg-white text-[#1b4332] border-2 border-amber-400 rounded-bl-xs'
                        : 'bg-white text-[#1c2e24] border border-[#e5dfd3] rounded-bl-xs'
                    }`}
                  >
                    {/* Admin or AI Sender Badge */}
                    {!isMe && (
                      <div className="flex items-center justify-between gap-2 border-b border-[#2d6a4f]/15 pb-2 mb-2.5">
                        <span className={`text-xs sm:text-sm font-bold ${msg.sender === 'admin' ? 'text-amber-800' : 'text-[#15803d]'}`}>
                          {msg.sender === 'admin' ? `👤 ${adminName}` : (lang === 'bn' ? '🌲 ঝাদিমাদি এআই (সহায়িকা)' : '🌲 Jhadimadi AI Assistant')}
                        </span>
                        
                        {/* Speaker audio replay button */}
                        <button
                          type="button"
                          onClick={() => speakText(msg.text)}
                          className="text-[#2d6a4f]/60 hover:text-[#1b4332] p-1 rounded transition cursor-pointer"
                          title="মেসেজটি শুনুন (Listen)"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Voice Note Bubble representation */}
                    {msg.isVoice ? (
                      <div className="flex flex-col gap-1.5 py-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleVoicePlayback(msg.id, msg.text)}
                            className="w-8 h-8 rounded-full bg-white/25 hover:bg-white/35 text-white flex items-center justify-center transition active:scale-90 cursor-pointer shadow-xs shrink-0"
                          >
                            {activeVoicePlayingId === msg.id ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            )}
                          </button>

                          {/* Sound wave graphic */}
                          <div className="flex-1 flex items-center gap-0.5 h-6 px-1">
                            {[40, 75, 55, 90, 30, 85, 60, 95, 45, 70, 35, 80, 50].map((h, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full transition-all ${
                                  activeVoicePlayingId === msg.id ? 'bg-amber-300 animate-pulse' : 'bg-white/80'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>

                          <span className="text-[10px] font-mono text-white/90 shrink-0">
                            {msg.voiceDuration || '0:04'}
                          </span>
                        </div>

                        {/* Transcribed text */}
                        <div className="text-xs text-white/95 italic bg-black/10 p-1.5 rounded-lg mt-0.5">
                          "{msg.text}"
                        </div>
                      </div>
                    ) : (
                      /* Regular Text Message (Minimum 18px body text, leading-relaxed line spacing) */
                      <div className={`whitespace-pre-line break-words text-[18px] sm:text-[19px] md:text-[20px] leading-relaxed font-normal tracking-normal ${isMe ? 'text-[#FBF9F5] font-normal' : 'text-[#1c2e24]'}`}>
                        {renderChatMessageContent(msg.text)}
                      </div>
                    )}

                    {/* Preliminary Assistance Notice for Sensitive Workflows */}
                    {(msg.preliminaryNotice || msg.searchResultData?.preliminaryNotice) && (
                      <div className="mt-2.5 p-2.5 bg-amber-50/95 border border-amber-300 rounded-xl text-amber-950 text-[11px] flex items-start gap-2 shadow-2xs">
                        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          <span className="font-extrabold text-amber-950">প্রাথমিক সহায়তা: </span>
                          <span>{msg.preliminaryNotice || msg.searchResultData?.preliminaryNotice}</span>
                        </div>
                      </div>
                    )}

                    {/* Clarification Box (Interactive Suggestion Chips) */}
                    {(msg.clarificationNeeded || msg.searchResultData?.clarificationNeeded) && (
                      <div className="mt-2.5 bg-sky-50/95 border border-sky-200 p-2.5 rounded-xl text-sky-950 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold text-sky-900 text-xs mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>অনুসন্ধান স্পষ্টীকরণ প্রয়োজন</span>
                        </div>
                        <p className="text-[11px] text-stone-700 leading-snug">
                          {msg.clarificationQuestion || msg.searchResultData?.clarificationQuestion || 'আপনার অনুরোধটি আরো স্পষ্টভাবে বুঝতে নিচের বিকল্পগুলো থেকে নির্বাচন করুন:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(msg.clarificationChips || msg.searchResultData?.clarificationChips || ['🛍️ পাহাড়ি খাঁটি পণ্য', '🛠️ মিস্ত্রি ও সেবা', '🩸 জরুরি রক্তদাতা', '💼 চাকরির বিজ্ঞপ্তি']).map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => handleSendMessage(chip)}
                              className="px-2.5 py-1 bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-lg text-[10.5px] font-bold shadow-2xs active:scale-95 transition cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Confirmation Receipt Card (Rendered if order is placed) */}
                    {(msg.isOrder || msg.orderData?.is_order || msg.orderData?.order_status === 'confirmed' || (msg.text && (msg.text.includes('"order_status": "confirmed"') || msg.text.includes('"order_status":"confirmed"') || msg.text.includes('"is_order": true')))) && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200">
                        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 border border-emerald-300 rounded-xl p-3 text-stone-900 shadow-xs">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/90">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>অর্ডার কনফার্মেশন (Order Confirmed)</span>
                            </div>
                            <span className="text-[9.5px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              VERIFIED ORDER
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11.5px]">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-stone-500 shrink-0 font-medium">ক্রেতার নাম:</span>
                              <span className="font-semibold text-stone-900 text-right">
                                {msg.orderData?.customer_name || currentUser?.name || 'রেকর্ডকৃত'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-stone-500 shrink-0 font-medium">মোবাইল নম্বর:</span>
                              <span className="font-bold text-emerald-800 text-right font-mono">
                                {msg.orderData?.phone || currentUser?.phone || 'সংগৃহীত'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-stone-500 shrink-0 font-medium">ডেলিভারি ঠিকানা:</span>
                              <span className="font-medium text-stone-800 text-right max-w-[200px]">
                                {msg.orderData?.delivery_address || msg.orderData?.address || 'চ্যাটে উল্লিখিত'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-stone-500 shrink-0 font-medium">অর্ডারকৃত পণ্য:</span>
                              <div className="font-bold text-emerald-950 text-right max-w-[200px]">
                                {Array.isArray(msg.orderData?.items) && msg.orderData.items.length > 0 ? (
                                  msg.orderData.items.map((it: any, i: number) => (
                                    <div key={i}>
                                      {it.product_name || it.name} {it.quantity ? `(${it.quantity} টি)` : ''}
                                    </div>
                                  ))
                                ) : (
                                  <span>{msg.orderData?.product || 'ঝাদিমাদি অর্গানিক পণ্য'}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[10.5px] text-emerald-800">
                            <span className="flex items-center gap-1 font-medium">
                              <Truck className="w-3.5 h-3.5" />
                              <span>ক্যাশ অন ডেলিভারি (২-৩ দিন)</span>
                            </span>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300 font-semibold text-emerald-700">
                              Jhadimadi AI Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Service Info Card (if inquiry about local worker / service) */}
                    {msg.serviceInfo && (
                      <div className="mt-2.5 pt-2 border-t border-stone-200 bg-emerald-50/70 p-2.5 rounded-xl text-stone-900 border border-emerald-200">
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#009f4d] mb-1">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{msg.serviceInfo.title}</span>
                        </div>
                        <div className="text-[11px] space-y-0.5 text-stone-700">
                          <p>• <strong>আনুমানিক রেট:</strong> {msg.serviceInfo.rate}</p>
                          <p>• <strong>ডেলিভারি / পৌঁছানোর সময়:</strong> {msg.serviceInfo.deliveryTime}</p>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleSendMessage('আমি একজন মিস্ত্রি বা সার্ভিস বুক করতে চাই। বুকিং কীভাবে হবে?');
                            }}
                            className="px-2.5 py-1 bg-[#009f4d] hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs active:scale-95 cursor-pointer"
                          >
                            সার্ভিস বুক করুন
                          </button>
                          <a
                            href="tel:01870592699"
                            className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-[10px] font-bold shadow-2xs"
                          >
                            সরাসরি কল
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Intelligent Search Engine Structured Results Card */}
                    {msg.searchResultData && (
                      <div className="mt-2.5 pt-2 border-t border-stone-200">
                        {/* Search Engine Header & Structured Intent Tags */}
                        <div className="bg-white/95 rounded-xl p-2.5 border border-emerald-200 shadow-2xs mb-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                              <Search className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ইন্টেলিজেন্ট সার্চ ইঞ্জিন</span>
                            </div>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              ভেরিফাইড ডাটাবেজ
                            </span>
                          </div>

                          {/* Structured Intent Chips */}
                          {msg.searchResultData.structuredIntent && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {msg.searchResultData.structuredIntent.profession && (
                                <span className="text-[9.5px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold border border-stone-200">
                                  পেশা: {msg.searchResultData.structuredIntent.profession}
                                </span>
                              )}
                              {msg.searchResultData.structuredIntent.location && (
                                <span className="text-[9.5px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold border border-stone-200">
                                  এলাকা: {msg.searchResultData.structuredIntent.location}
                                </span>
                              )}
                              {msg.searchResultData.structuredIntent.budget && (
                                <span className="text-[9.5px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold border border-stone-200">
                                  বাজেট: {msg.searchResultData.structuredIntent.budget}
                                </span>
                              )}
                              {msg.searchResultData.structuredIntent.date && (
                                <span className="text-[9.5px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold border border-stone-200">
                                  তারিখ: {msg.searchResultData.structuredIntent.date}
                                </span>
                              )}
                              {msg.searchResultData.structuredIntent.availability && (
                                <span className="text-[9.5px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold border border-stone-200">
                                  সময়: {msg.searchResultData.structuredIntent.availability}
                                </span>
                              )}
                              {msg.searchResultData.structuredIntent.ratingPreference && (
                                <span className="text-[9.5px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-semibold border border-amber-200">
                                  রেটিং পছন্দ: {msg.searchResultData.structuredIntent.ratingPreference}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* If No Real Matches Found */}
                        {!msg.searchResultData.hasRealMatches || msg.searchResultData.items.length === 0 ? (
                          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-stone-800">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="text-[11.5px] leading-snug">
                                <p className="font-bold text-amber-900">ডাটাবেজে এই মুহূর্তে কোনো তথ্য পাওয়া যায়নি</p>
                                <p className="text-stone-600 mt-1 text-[11px]">
                                  AI সিস্টেম কখনোই অসত্য বা কাল্পনিক তথ্য বানায় না। অনুগ্রহ করে বানান পরিবর্তন করুন অথবা আমাদের হেল্পলাইনে কল করুন।
                                </p>
                                <div className="mt-2.5 flex items-center gap-2">
                                  <a
                                    href="tel:01870592699"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold no-underline"
                                  >
                                    <Phone className="w-3 h-3 fill-white" />
                                    <span>হেল্পলাইনে কল করুন</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleSendMessage('সব পাহাড়ি পণ্যের তালিকা')}
                                    className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-[10px] font-semibold"
                                  >
                                    পণ্য দেখুন
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Render Verified Results List */
                          <div className="space-y-2.5">
                            {/* 1. Service Providers */}
                            {msg.searchResultData.matchType === 'provider' &&
                              msg.searchResultData.items.map((sp: any, spIdx: number) => (
                                <div
                                  key={sp.id || spIdx}
                                  onClick={() => {
                                    onClose();
                                    onOpenProfile?.(sp);
                                  }}
                                  className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200 shadow-xs flex flex-col gap-2.5 transition cursor-pointer group"
                                >
                                  <div className="flex gap-3 items-center">
                                    <img
                                      src={sp.photo_url || sp.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300'}
                                      alt={sp.name}
                                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200 shadow-2xs group-hover:scale-105 transition"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300';
                                      }}
                                    />
                                    <div className="flex-1 min-w-0 text-[11px]">
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="font-extrabold text-stone-900 text-xs truncate group-hover:text-emerald-700 transition">
                                          {sp.name}
                                        </h4>
                                        <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded shrink-0">
                                          {sp.districtUniqueId || sp.uniqueId || 'ভেরিফাইড'}
                                        </span>
                                      </div>

                                      <p className="text-emerald-700 font-bold text-[11px] mt-0.5">
                                        {sp.profession || 'প্রফেশনাল সার্ভিস প্রোভাইডার'} {sp.subCategory ? `• ${sp.subCategory}` : ''}
                                      </p>

                                      <p className="text-stone-500 text-[10px] mt-0.5 flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span>{sp.upazila || 'সদর'}, {sp.district || 'পার্বত্য চট্টগ্রাম'}</span>
                                        {sp.hourlyRate && (
                                          <span className="ml-1.5 font-bold text-stone-700">• ৳ {sp.hourlyRate}/ঘণ্টা</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Direct Action Button to Digital Profile */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      onOpenProfile?.(sp);
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#009f4d] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>যোগাযোগ করুন / প্রোফাইল দেখুন (View Profile)</span>
                                  </button>
                                </div>
                              ))}

                            {/* 2. Registered Members / Local Representatives */}
                            {msg.searchResultData.matchType === 'member' &&
                              msg.searchResultData.items.map((m: any, mIdx: number) => (
                                <div
                                  key={m.id || mIdx}
                                  onClick={() => {
                                    onClose();
                                    onOpenProfile?.(m);
                                  }}
                                  className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200 shadow-xs flex flex-col gap-2.5 transition cursor-pointer group"
                                >
                                  <div className="flex gap-3 items-center">
                                    <img
                                      src={m.photo_url || m.avatar || m.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'Member')}&background=009f4d&color=fff`}
                                      alt={m.name}
                                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200 shadow-2xs group-hover:scale-105 transition"
                                    />
                                    <div className="flex-1 min-w-0 text-[11px]">
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="font-extrabold text-stone-900 text-xs truncate group-hover:text-emerald-700 transition">
                                          {m.name}
                                        </h4>
                                        <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded shrink-0">
                                          {m.districtUniqueId || m.uniqueId || 'সদস্য'}
                                        </span>
                                      </div>

                                      <p className="text-emerald-700 font-bold text-[11px] mt-0.5">
                                        {m.roleLabelBn || m.job || m.profession || 'ঝাদিমাদি স্থানীয় প্রতিনিধি'}
                                      </p>

                                      <p className="text-stone-500 text-[10px] mt-0.5 flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span>{m.upazila || 'সদর'}, {m.district || 'পার্বত্য চট্টগ্রাম'}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Direct Action Button to Digital Profile */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      onOpenProfile?.(m);
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>যোগাযোগ করুন / প্রোফাইল দেখুন (View Profile)</span>
                                  </button>
                                </div>
                              ))}

                            {/* 3. Blood Donors */}
                            {msg.searchResultData.matchType === 'blood' &&
                              msg.searchResultData.items.map((bd: any, bdIdx: number) => (
                                <div
                                  key={bd.id || bdIdx}
                                  onClick={() => {
                                    onClose();
                                    onOpenProfile?.(bd);
                                  }}
                                  className="bg-white hover:bg-rose-50/50 p-3 rounded-2xl border border-rose-200 shadow-xs flex flex-col gap-2.5 transition cursor-pointer group"
                                >
                                  <div className="flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded-xl bg-rose-600 text-white font-black flex items-center justify-center text-base shadow-xs shrink-0 group-hover:scale-105 transition">
                                      {bd.bloodGroup}
                                    </div>
                                    <div className="flex-1 min-w-0 text-[11px]">
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="font-extrabold text-stone-900 text-xs truncate group-hover:text-rose-700 transition">
                                          {bd.name}
                                        </h4>
                                        <span className="text-[9px] font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded shrink-0">
                                          {bd.districtUniqueId || 'রক্তদাতা'}
                                        </span>
                                      </div>

                                      <p className="text-rose-700 font-bold text-[11px] mt-0.5">
                                        জরুরি রক্তদান সেবা • ব্লাড গ্রুপ {bd.bloodGroup}
                                      </p>

                                      <p className="text-stone-500 text-[10px] mt-0.5 flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span>{bd.area ? bd.area + ', ' : ''}{bd.upazila || ''}, {bd.district || ''}</span>
                                      </p>
                                      {bd.lastDonationDate && (
                                        <p className="text-rose-600/80 text-[9.5px] mt-0.5">
                                          শেষ রক্তদান: {bd.lastDonationDate}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Direct Action Button to Digital Profile */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      onOpenProfile?.(bd);
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>যোগাযোগ করুন / প্রোফাইল দেখুন (View Profile)</span>
                                  </button>
                                </div>
                              ))}

                            {/* 4. Products (Mangoes, Jackfruits, Wholesale Crops, Land) */}
                            {msg.searchResultData.matchType === 'product' &&
                              msg.searchResultData.items.map((prod: any, prodIdx: number) => (
                                <div
                                  key={prod.id || prodIdx}
                                  onClick={() => {
                                    onClose();
                                    if (onOpenProductDetails) {
                                      onOpenProductDetails(prod);
                                    } else {
                                      onOpenProfile?.(prod);
                                    }
                                  }}
                                  className="bg-white hover:bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200 shadow-xs flex flex-col gap-2.5 transition cursor-pointer group"
                                >
                                  <div className="flex gap-3 items-center">
                                    <img
                                      src={getProductPublicUrl(prod.image || (Array.isArray(prod.images) && prod.images[0]))}
                                      alt={prod.nameBn || prod.name}
                                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200 shadow-2xs group-hover:scale-105 transition"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                                      }}
                                    />
                                    <div className="flex-1 min-w-0 text-[11px]">
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="font-extrabold text-stone-900 text-xs truncate group-hover:text-emerald-700 transition">
                                          {prod.nameBn || prod.name}
                                        </h4>
                                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                          ৳ {prod.price}
                                        </span>
                                      </div>

                                      <p className="text-emerald-700 font-bold text-[11px] mt-0.5">
                                        {prod.categoryLabelBn || prod.category || 'পাহাড়ি খাঁটি কৃষিপণ্য'}
                                      </p>

                                      <p className="text-stone-500 text-[10px] mt-0.5 flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span>{prod.upazila || prod.origin || 'পার্বত্য অঞ্চল'}, {prod.district || ''}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Direct Action Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      if (onOpenProductDetails) {
                                        onOpenProductDetails(prod);
                                      } else {
                                        onOpenProfile?.(prod);
                                      }
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#009f4d] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>যোগাযোগ করুন / প্রোফাইল দেখুন (View Profile)</span>
                                  </button>
                                </div>
                              ))}

                            {/* 5. Job Seekers */}
                            {msg.searchResultData.matchType === 'job_seeker' &&
                              msg.searchResultData.items.map((js: any, jsIdx: number) => (
                                <div
                                  key={js.id || jsIdx}
                                  onClick={() => {
                                    onClose();
                                    onOpenProfile?.(js);
                                  }}
                                  className="bg-white hover:bg-indigo-50/50 p-3 rounded-2xl border border-indigo-200 shadow-xs flex flex-col gap-2.5 transition cursor-pointer group"
                                >
                                  <div className="flex gap-3 items-center">
                                    <img
                                      src={js.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                                      alt={js.name}
                                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200 shadow-2xs group-hover:scale-105 transition"
                                    />
                                    <div className="flex-1 min-w-0 text-[11px]">
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="font-extrabold text-stone-900 text-xs truncate group-hover:text-indigo-700 transition">
                                          {js.name}
                                        </h4>
                                        <span className="text-[9px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded shrink-0">
                                          {js.unique_id || 'প্রার্থী'}
                                        </span>
                                      </div>
                                      <p className="text-indigo-700 font-bold text-[11px] mt-0.5">
                                        দক্ষতা: {js.skills_or_job_type}
                                      </p>
                                      <p className="text-stone-500 text-[10px] mt-0.5 flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span>{js.upazila || ''}, {js.district || ''}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      onOpenProfile?.(js);
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>যোগাযোগ করুন / প্রোফাইল দেখুন (View Profile)</span>
                                  </button>
                                </div>
                              ))}

                            {/* 6. Job Circulars */}
                            {msg.searchResultData.matchType === 'job_circular' &&
                              msg.searchResultData.items.map((jc: any, jcIdx: number) => (
                                <div
                                  key={jc.id || jcIdx}
                                  onClick={() => {
                                    onClose();
                                    onOpenProfile?.({
                                      name: jc.company_or_poster,
                                      profession: jc.job_title,
                                      district: jc.district,
                                      upazila: jc.upazila,
                                      ...jc
                                    });
                                  }}
                                  className="bg-white hover:bg-blue-50/50 p-3 rounded-2xl border border-blue-200 shadow-xs flex flex-col gap-2.5 transition cursor-pointer group"
                                >
                                  <div className="text-[11px]">
                                    <h4 className="font-extrabold text-stone-900 text-xs group-hover:text-blue-700 transition">
                                      {jc.job_title}
                                    </h4>
                                    <p className="text-blue-700 font-bold text-[11px] mt-0.5">
                                      প্রতিষ্ঠান: {jc.company_or_poster}
                                    </p>
                                    <p className="text-stone-500 text-[10px] mt-0.5 flex items-center gap-1 truncate">
                                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                      <span>{jc.upazila || ''}, {jc.district || ''}</span>
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      onOpenProfile?.({
                                        name: jc.company_or_poster,
                                        profession: jc.job_title,
                                        district: jc.district,
                                        upazila: jc.upazila,
                                        ...jc
                                      });
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>যোগাযোগ করুন / প্রোফাইল দেখুন (View Profile)</span>
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Product Recommendation Cards (with Direct Order & Cart buttons) */}
                    {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-stone-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-extrabold text-[#009f4d] uppercase tracking-wider flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            <span>প্রস্তাবিত পণ্য ও সরাসরি অর্ডার:</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {msg.recommendedProducts.map((prod, pIdx) => {
                            const storeProduct = getMatchedProduct(prod);

                            return (
                              <div
                                key={pIdx}
                                className="bg-stone-50 hover:bg-emerald-50/60 p-2 rounded-xl border border-stone-200/90 flex gap-2.5 items-center transition shadow-2xs group"
                              >
                                <img
                                  src={getProductPublicUrl(prod.image || storeProduct.image)}
                                  alt={prod.name}
                                  className="w-13 h-13 rounded-lg object-cover shrink-0 border border-stone-200 shadow-2xs"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = NO_IMAGE_AVAILABLE_ICON;
                                  }}
                                />

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-extrabold text-[11.5px] text-stone-900 truncate">
                                    {prod.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[12px] font-black text-[#009f4d]">
                                      {prod.price || `৳ ${storeProduct.price}`}
                                    </span>
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                      স্টকে আছে
                                    </span>
                                  </div>

                                  {/* Direct Order & Cart Action Buttons */}
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    {/* Direct Order Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onDirectOrder) {
                                          onDirectOrder(storeProduct);
                                        } else if (onAddToCart) {
                                          onAddToCart(storeProduct, 1);
                                        }
                                        onClose();
                                      }}
                                      className="px-2.5 py-1 bg-[#009f4d] hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[9.5px] font-black shadow-xs cursor-pointer flex items-center gap-1"
                                      title="সরাসরি চেকআউট করুন"
                                    >
                                      <ShoppingCart className="w-3 h-3" />
                                      <span>অর্ডার করুন</span>
                                    </button>

                                    {/* Add to Cart Button */}
                                    {onAddToCart && (
                                      <button
                                        type="button"
                                        onClick={() => onAddToCart(storeProduct, 1)}
                                        className="px-2 py-1 bg-white hover:bg-stone-100 active:scale-95 text-stone-800 border border-stone-300 rounded-lg text-[9.5px] font-bold cursor-pointer"
                                        title="কার্টে যোগ করুন"
                                      >
                                        কার্টে নিন
                                      </button>
                                    )}

                                    {/* Product Details */}
                                    {onOpenProductDetails && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onOpenProductDetails(storeProduct);
                                          onClose();
                                        }}
                                        className="px-1.5 py-1 text-stone-500 hover:text-stone-800 text-[9px] font-medium cursor-pointer"
                                      >
                                        বিস্তারিত
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Link Card (e.g. for blood, feed, helpline, services) */}
                    {msg.actionLink && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200/70">
                        {msg.actionLink.type === 'blood' ? (
                          <div className="flex flex-col sm:flex-row gap-1.5 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenBloodSearch) onOpenBloodSearch();
                                onClose();
                              }}
                              className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                            >
                              <Droplet className="w-3.5 h-3.5 fill-white" />
                              <span>{msg.actionLink.label || 'রক্তদাতা তালিকা দেখুন'}</span>
                            </button>
                            <a
                              href="tel:999"
                              className="py-1.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition shrink-0"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>জরুরি ৯৯৯</span>
                            </a>
                          </div>
                        ) : msg.actionLink.type === 'helpline' ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <a
                              href="tel:999"
                              className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                            >
                              <Phone className="w-3.5 h-3.5 fill-white" />
                              <span>জরুরি ৯৯৯ এ কল করুন</span>
                            </a>
                            <a
                              href="https://wa.me/8801870592699"
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shrink-0"
                            >
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : msg.actionLink.type === 'feed' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenFeed) onOpenFeed(msg.actionLink?.postId);
                              onClose();
                            }}
                            className="w-full py-1.5 px-3 bg-[#009f4d] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                          >
                            <span>{msg.actionLink.label || 'পোস্টটি দেখুন'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              handleSendMessage(msg.actionLink?.label || 'বিস্তারিত বলুন');
                            }}
                            className="py-1.5 px-3 bg-[#009f4d] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                          >
                            <span>{msg.actionLink.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Quick Response Action Chips for this message */}
                    {msg.quickReplyChips && msg.quickReplyChips.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-stone-200/60 flex flex-wrap gap-1">
                        {msg.quickReplyChips.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              if (chip.includes('৯৯৯') || chip.includes('999')) {
                                window.location.href = 'tel:999';
                              } else if (chip.includes('WhatsApp') || chip.includes('হোয়াটসঅ্যাপ')) {
                                window.open('https://wa.me/8801870592699', '_blank');
                              } else if (chip.includes('পোস্ট') && onOpenFeed) {
                                onOpenFeed(msg.actionLink?.postId);
                                onClose();
                              } else if (chip.includes('রক্তদাতা') && onOpenBloodSearch) {
                                onOpenBloodSearch();
                                onClose();
                              } else {
                                handleSendMessage(chip);
                              }
                            }}
                            className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-emerald-100 text-stone-800 text-[10px] font-bold border border-stone-300/80 transition cursor-pointer active:scale-95"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp & double tick (WhatsApp style) */}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-emerald-100' : 'text-stone-400'}`}>
                      <span>{msg.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-amber-200" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing / Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-stone-600 text-xs p-2 animate-in fade-in">
              <div className="w-7 h-7 rounded-full bg-[#009f4d] text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-xs shadow-2xs border border-stone-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#009f4d] animate-ping" />
                <span className="font-semibold text-stone-700 text-xs">
                  {isAdminMode ? 'অ্যাডমিন রিপ্লাই লিখছেন...' : (lang === 'bn' ? 'ঝাদিমাদি এআই উত্তর তৈরি করছে...' : 'Jhadimadi AI is replying...')}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= 3. HORIZONTAL QUICK PROMPT CHIPS ================= */}
        <div className="bg-[#FBF9F5] px-3 pt-2 pb-1.5 shrink-0 border-t border-stone-200/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickPromptPills.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(promptText)}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50 active:scale-95 text-stone-800 text-xs sm:text-[13.5px] font-semibold whitespace-nowrap border border-stone-300/90 shadow-2xs transition cursor-pointer shrink-0"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* ================= 4. PINNED BOTTOM SEARCH & CHAT INPUT BAR ================= */}
        <footer 
          className="p-3 sm:p-4 bg-[#FBF9F5] shrink-0 border-t border-stone-200/80 sticky bottom-0 z-30 shadow-xs"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          }}
        >
          {/* Active Voice Recording Bar */}
          {isRecordingVoice ? (
            <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 p-2.5 rounded-full shadow-lg animate-pulse px-4">
              <div className="flex items-center gap-2 text-red-600 font-bold text-xs sm:text-sm">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <span>ভয়েস রেকর্ড হচ্ছে... ({recordingSeconds}s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(false)}
                  className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-full cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleStartVoiceRecording}
                  className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full cursor-pointer shadow-xs transition"
                >
                  সমাপ্ত ও পাঠান
                </button>
              </div>
            </div>
          ) : (
            /* Floating Capsule Input Form with Live Database Query and Voice Record */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="bg-white rounded-full shadow-md border border-[#15803d]/35 pl-2 pr-1.5 py-1.5 flex items-center gap-2"
            >
              {/* Voice Message Microphone Button */}
              <button
                type="button"
                onClick={handleStartVoiceRecording}
                className="w-10 h-10 rounded-full bg-emerald-50 hover:bg-emerald-100 active:scale-90 text-[#15803d] transition cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
                title="ভয়েস মেসেজ বলুন (Voice Note)"
                id="btn-chat-mic-record"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Text Input Field */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'আপনার প্রয়োজন বা তথ্যের কথা এখানে লিখুন...' : 'Type what you need or search anything...'}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-transparent px-2 text-[15.5px] sm:text-[17px] font-medium text-slate-800 placeholder:text-stone-400 focus:outline-none border-none ring-0"
                  id="input-chat-message"
                />
              </div>

              {/* Prominent Green Send Button */}
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="w-10 h-10 rounded-full bg-[#15803d] hover:bg-[#166534] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition active:scale-95 shadow-sm cursor-pointer"
                title="মেসেজ বা অনুসন্ধান পাঠান"
                id="btn-chat-send"
              >
                <Send className="w-5 h-5 -ml-0.5" />
              </button>
            </form>
          )}
        </footer>

      </div>
    </div>
  );
};

export default JhadimadiChatModal;
