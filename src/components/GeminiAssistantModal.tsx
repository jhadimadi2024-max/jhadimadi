import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Bot, Loader2, ArrowRight, 
  MapPin, DollarSign, ShieldCheck, CheckCircle2, 
  Upload, Camera, AlertTriangle, RefreshCw, ShoppingCart, 
  FileText, User, Calendar, Award, CheckCircle, HelpCircle,
  MessageSquare, ShieldAlert, Sparkle, Phone, Eye, ArrowLeft, Mic, ChevronRight
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { 
  askGeminiSupportChat, 
  verifyNidWithGeminiVision, 
  GeminiProductRecommendation, 
  GeminiNidVerificationResult 
} from '../services/gemini';
import { StoreProduct } from '../data/productsData';
import { useData } from '../context/DataContext';
import { startBanglaVoiceRecognition } from '../utils/aiSearchParser';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendedProducts?: GeminiProductRecommendation[];
  quickReplyChips?: string[];
  timestamp: string;
}

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onNavigateToCategory?: (category: string) => void;
  onAddToCart?: (product: StoreProduct) => void;
  onOpenProductDetails?: (product: StoreProduct) => void;
  currentUser?: UserProfile | null;
  onVerificationSuccess?: (nidData: any) => void;
  initialTab?: 'chat' | 'nid';
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  lang = 'bn',
  onNavigateToCategory,
  onAddToCart,
  onOpenProductDetails,
  currentUser,
  onVerificationSuccess,
  initialTab = 'chat',
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'nid'>(initialTab);
  const { products: liveProducts } = useData();

  // Privacy-safe contact link renderer: renders `<a href="tel:...">যোগাযোগ করুন</a>` as a styled button
  const renderAssistantMessageContent = (text: string) => {
    if (!text) return null;
    const linkRegex = /<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    if (!linkRegex.test(text)) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const regex = /<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const href = match[1];
      const linkLabel = match[2];
      const isTel = href.startsWith('tel:');

      parts.push(
        <a
          key={`ast_link_${match.index}`}
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

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };
  
  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_init',
      sender: 'assistant',
      text: lang === 'bn' 
        ? '👋 স্বাগতম! আমি ঝাদিমাদি (Jhadimadi)।\n\nপাহাড়ের খাঁটি পণ্য অর্ডার, লোকাল মিস্ত্রি বুকিং, ডেলিভারি বা পেমেন্ট সংক্রান্ত যেকোনো সহায়তায় আমি আপনার পাশে আছি। আপনি বাংলায় যেকোনো প্রশ্ন করতে পারেন।'
        : '👋 Welcome! I am Jhadimadi. Ask any question about organic products, local worker hiring, delivery, or payments.',
      recommendedProducts: [
        {
          id: '1',
          name: 'ঝাড়িম্যাটি অর্গানিক পাহাড়ি প্রাকৃতিক মধু (১ কেজি)',
          price: '৳ ১২০০',
          category: 'hillfood',
          image: NO_IMAGE_AVAILABLE_ICON
        },
        {
          id: '2',
          name: 'রাঙ্গামাটি স্পেশাল বোম্বাই শুটকি (২৫০ গ্রাম)',
          price: '৳ ৩৫০',
          category: 'hillfood',
          image: NO_IMAGE_AVAILABLE_ICON
        }
      ],
      quickReplyChips: [
        '🍯 খাঁটি পাহাড়ি মধু ও শুটকি',
        '🚚 ডেলিভারি ও পেমেন্ট নিয়ম',
        '👗 হস্তচালিত তাঁতের পোশাক',
        '🛠️ লোকাল মিস্ত্রি ও কাজের রেট',
        '🛡️ এনআইডি ভেরিফিকেশন কীভাবে করব?'
      ],
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecognitionRef = useRef<any>(null);

  // NID Verification State
  const [nidFrontImage, setNidFrontImage] = useState<string | null>(null);
  const [nidBackImage, setNidBackImage] = useState<string | null>(null);
  const [isVerifyingNid, setIsVerifyingNid] = useState(false);
  const [nidResult, setNidResult] = useState<GeminiNidVerificationResult | null>(null);
  const [nidPhoneInput, setNidPhoneInput] = useState(currentUser?.phone || '');
  const [nidNameInput, setNidNameInput] = useState(currentUser?.name || '');
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isChatLoading]);

  if (!isOpen) return null;

  // Voice Search / Speech Recognition in Bengali (Mobile Permission & MediaRecorder Fallback)
  const handleVoiceInput = () => {
    try {
      if (isListeningVoice) {
        if (voiceRecognitionRef.current && typeof voiceRecognitionRef.current.stop === 'function') {
          voiceRecognitionRef.current.stop();
        }
        setIsListeningVoice(false);
        return;
      }

      const handle = startBanglaVoiceRecognition({
        onStart: () => {
          setIsListeningVoice(true);
        },
        onResult: (spokenText) => {
          if (spokenText) {
            setInputMessage(spokenText);
            handleSendMessage(spokenText);
          }
        },
        onError: (e) => {
          console.warn('Voice error:', e);
          setIsListeningVoice(false);
        },
        onEnd: () => {
          setIsListeningVoice(false);
        }
      });

      voiceRecognitionRef.current = handle;
    } catch (err) {
      console.error(err);
      setIsListeningVoice(false);
    }
  };

  // Send Support Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const response = await askGeminiSupportChat(text, history, {
        userName: currentUser?.name,
        phone: currentUser?.phone,
        location: 'পার্বত্য চট্টগ্রাম / বাংলাদেশ',
      });

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        text: response.replyBn || response.replyEn || 'আপনার অনুসন্ধানের তথ্য যাচাই করা হয়েছে।',
        recommendedProducts: response.recommendedProducts,
        quickReplyChips: response.quickReplyChips,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: 'bot_err_' + Date.now(),
          sender: 'assistant',
          text: 'দুঃখিত, সংযোগে সাময়িক বিলম্ব হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা নিচে ক্লিক করুন।',
          quickReplyChips: ['ডেলিভারি নিয়ম', 'পাহাড়ি মধু', 'এনআইডি ভেরিফিকেশন'],
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle NID Image Selection
  const handleNidFileSelected = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      if (side === 'front') {
        setNidFrontImage(base64);
      } else {
        setNidBackImage(base64);
      }
      setNidResult(null);
    } catch (err) {
      console.error('File read error:', err);
      alert('ছবি লোড করতে সমস্যা হয়েছে।');
    }
  };

  // Trigger Gemini Vision NID Verification
  const handleVerifyNid = async () => {
    if (!nidFrontImage) {
      alert('অনুগ্রহ করে আপনার এনআইডি কার্ডের সামনের অংশের ছবি আপলোড করুন।');
      return;
    }

    setIsVerifyingNid(true);
    setNidResult(null);

    try {
      const result = await verifyNidWithGeminiVision(
        nidFrontImage,
        nidBackImage || undefined,
        {
          phone: nidPhoneInput || currentUser?.phone || '',
          userName: nidNameInput || currentUser?.name || 'User',
        }
      );

      setNidResult(result);

      if (result.success && onVerificationSuccess && result.extractedData) {
        onVerificationSuccess(result.extractedData);
      }
    } catch (err) {
      console.error(err);
      setNidResult({
        success: false,
        message: 'যাচাইকরণে ত্রুটি হয়েছে। পরিষ্কার আলোতে তোলা ছবি দিয়ে পুনরায় চেষ্টা করুন।',
      });
    } finally {
      setIsVerifyingNid(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#fdfbfb] text-stone-900 w-full max-w-lg rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[760px] relative">
        
        {/* TOP HEADER */}
        <div className="bg-gradient-to-r from-[#16A34A] via-emerald-700 to-[#15803D] text-white p-3.5 sm:p-4 shadow-md shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-black">
                <Sparkles className="w-5 h-5 fill-slate-950 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                    ঝাদিমাদি Gemini AI অ্যাসিস্ট্যান্ট
                  </h2>
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs">
                    v3.7 Flash
                  </span>
                </div>
                <p className="text-[10.5px] text-emerald-100 font-medium">
                  {lang === 'bn' ? 'স্মার্ট কাস্টমার কেয়ার ও এআই-সহায়তাপ্রাপ্ত ডকুমেন্ট স্ক্রিনিং' : 'Smart Customer Support & AI-Assisted Document Screening'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              id="btn-close-gemini-modal"
              className="p-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-full cursor-pointer transition"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TWO MAIN TABS */}
          <div className="flex items-center gap-1.5 mt-3 bg-black/20 p-1 rounded-2xl border border-white/20">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              id="tab-gemini-chat"
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '✨ এআই সাপোর্ট চ্যাট' : '✨ AI Support Chat'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nid')}
              id="tab-gemini-nid-verify"
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'nid'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
              <span>{lang === 'bn' ? '🛡️ ডকুমেন্ট স্ক্রিনিং' : '🛡️ Document Screening'}</span>
              <span className="bg-emerald-950 text-emerald-300 text-[8px] font-black px-1.5 py-0.2 rounded-full">
                AI Vision
              </span>
            </button>
          </div>
        </div>

        {/* ===================== TAB 1: CUSTOMER SUPPORT CHAT ===================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#fdfbfb]">
            
            {/* Chat message list */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-1.5 max-w-[90%] sm:max-w-[85%]">
                    {msg.sender === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0 mb-1 shadow-2xs font-bold text-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#16A34A] text-white rounded-br-xs font-medium'
                          : 'bg-white text-stone-800 border border-stone-200/90 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line">{renderAssistantMessageContent(msg.text)}</div>

                      {/* Render Product Recommendations if attached to message */}
                      {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-stone-200 space-y-2">
                          <span className="text-[10px] font-black text-[#16A34A] uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>প্রস্তাবিত পণ্যসমূহ:</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.recommendedProducts.map((prod, pIdx) => {
                              const matchStoreProd = liveProducts.find(p => p.nameBn.includes(prod.name) || prod.name.includes(p.nameBn));

                              return (
                                <div
                                  key={pIdx}
                                  className="bg-stone-50 hover:bg-emerald-50/50 p-2 rounded-xl border border-stone-200 flex gap-2 items-center transition group shadow-2xs"
                                >
                                  <img
                                    src={getProductPublicUrl(prod.image || matchStoreProd?.image || NO_IMAGE_AVAILABLE_ICON)}
                                    alt={prod.name}
                                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-stone-200"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[11px] text-stone-900 truncate">
                                      {prod.name}
                                    </h4>
                                    <span className="text-[11px] font-extrabold text-[#16A34A] block">
                                      {prod.price}
                                    </span>
                                    <div className="flex items-center gap-1 mt-1">
                                      {onAddToCart && matchStoreProd && (
                                        <button
                                          onClick={() => onAddToCart(matchStoreProd)}
                                          className="px-2 py-0.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-md text-[9px] font-bold flex items-center gap-0.5 cursor-pointer shadow-xs active:scale-95"
                                        >
                                          <ShoppingCart className="w-2.5 h-2.5" />
                                          <span>কার্টে নিন</span>
                                        </button>
                                      )}
                                      {onOpenProductDetails && matchStoreProd && (
                                        <button
                                          onClick={() => {
                                            onOpenProductDetails(matchStoreProd);
                                            onClose();
                                          }}
                                          className="px-2 py-0.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-md text-[9px] font-bold cursor-pointer"
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

                      <span className={`text-[8.5px] block mt-1 ${msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-stone-400'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Render Quick Reply Chips */}
                  {msg.quickReplyChips && msg.quickReplyChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                      {msg.quickReplyChips.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => {
                            if (chip.includes('NID') || chip.includes('এনআইডি')) {
                              setActiveTab('nid');
                            } else {
                              handleSendMessage(chip);
                            }
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-stone-300 text-stone-700 hover:text-stone-900 rounded-full text-[10px] font-bold transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <span>{chip}</span>
                          <ChevronRight className="w-2.5 h-2.5 text-stone-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-stone-500 text-xs p-2">
                  <div className="w-7 h-7 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <span className="font-semibold animate-pulse">Gemini AI উত্তর লিখছে...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-2.5 sm:p-3 bg-white border-t border-stone-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title="বাংলা ভয়েসে বলুন (Speak in Bengali)"
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isListeningVoice
                      ? 'bg-red-500 text-white animate-pulse shadow-md'
                      : 'bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-[#16A34A]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="যেকোনো প্রশ্ন বাংলায় লিখুন (যেমন: পাহাড়ি মধু কত দিনে ডেলিভারি পাব?)..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isChatLoading}
                  className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#16A34A] focus:bg-white transition"
                />

                <button
                  type="submit"
                  disabled={isChatLoading || !inputMessage.trim()}
                  className="p-2 bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl cursor-pointer transition shadow-xs flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ===================== TAB 2: NID VISION VERIFICATION ===================== */}
        {activeTab === 'nid' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-[#fdfbfb]">
            
            {/* Anti-Fraud Info Banner */}
            <div className="bg-emerald-950 text-white p-3.5 rounded-2xl shadow-sm border border-emerald-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm text-white">
                  AI-Assisted Document Screening (এআই-সহায়তাপ্রাপ্ত ডকুমেন্ট স্ক্রিনিং)
                </h3>
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                প্ল্যাটফর্মের নিরাপত্তা ও পরিচয় জালিয়াতি রোধে আপনার পরিচয়পত্রের ছবি আপলোড করুন। এটি অভ্যন্তরীণ এআই ফরেনসিক স্ক্রিনিং দ্বারা প্রাক-যাচাই করা হয়।
              </p>
              <p className="text-[9.5px] text-amber-300/90 font-medium">
                * নোটিশ: এটি প্ল্যাটফর্মের নিজস্ব প্রাথমিক স্ক্রিনিং ব্যবস্থা। এটি কোনো অফিশিয়াল সরকারি পরিচয়পত্র সনদ বা সরকারি ডাটাবেজ ভেরিফিকেশন নয়।
              </p>
            </div>

            {/* Hidden File Inputs */}
            <input
              type="file"
              accept="image/*"
              ref={frontInputRef}
              onChange={(e) => handleNidFileSelected(e, 'front')}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              ref={backInputRef}
              onChange={(e) => handleNidFileSelected(e, 'back')}
              className="hidden"
            />

            {/* NID Upload Zone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Front Side Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span>১. NID কার্ডের সামনের ছবি (Front) <span className="text-red-500">*</span></span>
                  {nidFrontImage && (
                    <span className="text-[10px] text-[#16A34A] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> সিলেক্টেড
                    </span>
                  )}
                </label>

                <div
                  onClick={() => frontInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[130px] ${
                    nidFrontImage
                      ? 'border-[#16A34A] bg-emerald-50/50'
                      : 'border-stone-300 hover:border-[#16A34A] bg-white hover:bg-stone-50'
                  }`}
                >
                  {nidFrontImage ? (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-2xs border border-stone-200">
                      <img src={nidFrontImage} alt="NID Front" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[10px] font-bold">
                        ছবি পরিবর্তন করুন
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-stone-800">ছবি আপলোড বা তুলুন</p>
                      <p className="text-[9.5px] text-stone-500">JPG, PNG (Front side)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Side Upload (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span>২. NID কার্ডের পিছনের ছবি (Back)</span>
                  {nidBackImage && (
                    <span className="text-[10px] text-[#16A34A] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> সিলেক্টেড
                    </span>
                  )}
                </label>

                <div
                  onClick={() => backInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[130px] ${
                    nidBackImage
                      ? 'border-[#16A34A] bg-emerald-50/50'
                      : 'border-stone-300 hover:border-[#16A34A] bg-white hover:bg-stone-50'
                  }`}
                >
                  {nidBackImage ? (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-2xs border border-stone-200">
                      <img src={nidBackImage} alt="NID Back" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[10px] font-bold">
                        ছবি পরিবর্তন করুন
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-stone-700">পিছনের ছবি (ঐচ্ছিক)</p>
                      <p className="text-[9.5px] text-stone-400">ঠিকানা ও বারকোড যাচাই</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* User Details Preview Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">ইউজারের নাম (User Name)</label>
                <input
                  type="text"
                  value={nidNameInput}
                  onChange={(e) => setNidNameInput(e.target.value)}
                  placeholder="আপনার নাম লিখুন"
                  className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:border-[#16A34A] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">মোবাইল নম্বর (Phone Number)</label>
                <input
                  type="tel"
                  value={nidPhoneInput}
                  onChange={(e) => setNidPhoneInput(e.target.value)}
                  placeholder="01812345678"
                  className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:border-[#16A34A] outline-none"
                />
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={handleVerifyNid}
              disabled={isVerifyingNid || !nidFrontImage}
              id="btn-trigger-gemini-nid-verify"
              className="w-full py-3 bg-[#16A34A] hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifyingNid ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini Vision ডকুমেন্ট স্ক্রিনিং চলছে...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Gemini Vision দিয়ে ডকুমেন্ট স্ক্রিনিং করুন</span>
                </>
              )}
            </button>

            {/* ================= VERIFICATION RESULT DISPLAY ================= */}
            {nidResult && (
              <div className="space-y-3 pt-2">
                
                {/* 1. DUPLICATE NID DETECTED WARNING */}
                {nidResult.isDuplicate && (
                  <div className="bg-amber-50 border-2 border-amber-400 p-3.5 rounded-2xl space-y-2 text-stone-900 shadow-sm animate-fadeIn">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>ডুপ্লিকেট NID শনাক্তকরণ সতর্কতা! (Duplicate Registration Blocked)</span>
                    </div>
                    <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                      {nidResult.duplicateWarning || nidResult.message}
                    </p>
                    <div className="bg-white/80 p-2 rounded-xl text-[10px] text-stone-700 font-mono">
                      NID Number: <span className="font-bold text-amber-800">{nidResult.extractedData?.nidNumber}</span>
                    </div>
                  </div>
                )}

                {/* 2. FAKE / TAMPERED NID DETECTED WARNING */}
                {!nidResult.isDuplicate && nidResult.isFakeDetected && (
                  <div className="bg-rose-50 border-2 border-rose-400 p-3.5 rounded-2xl space-y-2 text-stone-900 shadow-sm animate-fadeIn">
                    <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>সতর্কতা: জাল বা ডিজিটাল এডিটেড NID সন্দেহজনক! (Fake / Edited Card)</span>
                    </div>
                    <p className="text-[11px] text-rose-950 font-medium leading-relaxed">
                      {nidResult.message}
                    </p>
                    {nidResult.tamperWarnings && nidResult.tamperWarnings.length > 0 && (
                      <ul className="list-disc list-inside text-[10.5px] text-rose-800 space-y-1 bg-white/70 p-2 rounded-xl">
                        {nidResult.tamperWarnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between text-[10px] font-bold text-rose-900 bg-rose-100 p-2 rounded-xl">
                      <span>ফরেনসিক স্কোর (Legitimacy Score):</span>
                      <span>{nidResult.authenticityScore || 20}%</span>
                    </div>
                  </div>
                )}

                {/* 3. SUCCESSFUL AUTHENTIC NID SCREENED CARD */}
                {nidResult.success && !nidResult.isFakeDetected && nidResult.extractedData && (
                  <div className="bg-white border-2 border-[#16A34A] rounded-2xl p-4 space-y-3 shadow-md animate-fadeIn">
                    
                    {/* Success Header */}
                    <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
                          <CheckCircle className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-[#16A34A]">
                            AI-Assisted Document Screened [✓]
                          </h4>
                          <span className="text-[9.5px] text-stone-600">
                            অভ্যন্তরীণ প্ল্যাটফর্ম স্ক্রিনিং সম্পন্ন
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="bg-[#16A34A] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                          {nidResult.extractedData.nidType}
                        </span>
                        <span className="text-[8.5px] text-emerald-800 font-bold block mt-0.5">
                          স্কোর: {nidResult.extractedData.authenticityScore}%
                        </span>
                      </div>
                    </div>

                    {/* Extracted Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 space-y-0.5">
                        <span className="text-[9px] font-bold text-stone-500 uppercase">জাতীয় পরিচয়পত্র নং (NID No):</span>
                        <p className="font-extrabold text-stone-900 text-sm tracking-wider font-mono">
                          {nidResult.extractedData.nidNumber}
                        </p>
                      </div>

                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 space-y-0.5">
                        <span className="text-[9px] font-bold text-stone-500 uppercase">নাম (Name):</span>
                        <p className="font-bold text-stone-900">
                          {nidResult.extractedData.nameBangla}
                        </p>
                        <p className="text-[10px] text-stone-600 font-medium">
                          {nidResult.extractedData.nameEnglish}
                        </p>
                      </div>

                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 space-y-0.5">
                        <span className="text-[9px] font-bold text-stone-500 uppercase">পিতা ও মাতা (Parents):</span>
                        <p className="text-[10.5px] text-stone-800">
                          পিতা: {nidResult.extractedData.fatherName || 'প্রযোজ্য'}
                        </p>
                        <p className="text-[10.5px] text-stone-800">
                          মাতা: {nidResult.extractedData.motherName || 'প্রযোজ্য'}
                        </p>
                      </div>

                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 space-y-0.5">
                        <span className="text-[9px] font-bold text-stone-500 uppercase">জন্ম তারিখ ও রক্তের গ্রুপ:</span>
                        <p className="text-[10.5px] font-bold text-stone-900">
                          {nidResult.extractedData.dateOfBirth}
                        </p>
                        {nidResult.extractedData.bloodGroup && (
                          <span className="inline-block bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5">
                            Blood Group: {nidResult.extractedData.bloodGroup}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Forensic Verification Summary */}
                    <p className="text-[10.5px] text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-200 leading-relaxed font-medium">
                      {nidResult.extractedData.verificationSummaryBn}
                    </p>

                    <div className="bg-emerald-100 text-emerald-950 p-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                      <Award className="w-4 h-4 text-[#16A34A]" />
                      <span>আপনার অ্যাকাউন্টে "AI-Assisted Document Screened [✓]" ব্লু-টিক ব্যাজ সফলভাবে অ্যাক্টিভ হয়েছে!</span>
                    </div>

                    <p className="text-[9.5px] text-stone-500 text-center italic">
                      * বিজ্ঞপ্তি: এটি শুধুমাত্র প্ল্যাটফর্মের অভ্যন্তরীণ এআই স্ক্রিনিং, কোনো সরকারি অফিসিয়াল সনদপত্র নয়।
                    </p>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
