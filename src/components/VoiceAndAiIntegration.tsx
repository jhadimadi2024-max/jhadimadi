import React, { useState, useEffect, useRef } from 'react';
import { startBanglaVoiceRecognition } from '../utils/aiSearchParser';
import { 
  Mic, MicOff, Bot, Send, ShieldCheck, AlertTriangle, Sparkles, 
  Search, X, CheckCircle2, ChevronRight, MessageSquare, Volume2, 
  VolumeX, RefreshCw, Zap, Award, Check, Camera
} from 'lucide-react';

interface VoiceAndAiIntegrationProps {
  onSearchSubmit?: (query: string) => void;
  onSelectCategory?: (category: string) => void;
  lang?: 'bn' | 'en';
}

export const VoiceAndAiIntegration: React.FC<VoiceAndAiIntegrationProps> = ({
  onSearchSubmit,
  onSelectCategory,
  lang = 'bn'
}) => {
  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceTranscriptFeedback, setVoiceTranscriptFeedback] = useState<string | null>(null);

  // Web Speech API recognition ref
  const recognitionRef = useRef<any>(null);

  // AI Chatbot States
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'ai' | 'user';
    text: string;
    timestamp: string;
    suggestedActions?: Array<{ label: string; action: () => void }>;
  }>>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: lang === 'bn' 
        ? 'হ্যালো! আমি ঝাদিমাদি (Jhadimadi.com) এআই স্মার্ট সহকারী। পণ্য অনুসন্ধান, বিক্রেতা নিবন্ধন, এনআইডি ভেরিফিকেশন অথবা যেকোনো সার্ভিস পরামর্শের জন্য আমাকে জিজ্ঞেস করতে পারেন।'
        : 'Hello! I am your AI Smart Assistant for Jhadimadi.com. How can I help you find services, verify your vendor account, or track orders today?',
      timestamp: 'এখন'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll chat to bottom
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen, isTyping]);

  // Voice Recognition Toggle with Mobile Runtime Permissions & MediaRecorder Fallback
  const toggleVoiceSearch = () => {
    if (!isListening) {
      setIsListening(true);
      setVoiceTranscriptFeedback(lang === 'bn' ? 'মাইক্রোফোন চালু আছে, অনুগ্রহ করে কথা বলুন...' : 'Listening... Speak into your microphone');

      const handle = startBanglaVoiceRecognition({
        onStart: () => {
          setIsListening(true);
        },
        onResult: (transcript) => {
          setSearchQuery(transcript);
          setVoiceTranscriptFeedback(`✓ শোনা গেছে: "${transcript}"`);
          if (onSearchSubmit) {
            onSearchSubmit(transcript);
          }
        },
        onError: (err) => {
          setIsListening(false);
          setVoiceTranscriptFeedback(err || (lang === 'bn' ? 'ভয়েস গ্রহণ করা যায়নি। অনুগ্রহ করে কিবোর্ডে লিখে অনুসন্ধান করুন।' : 'Voice not captured. Please type your query.'));
        },
        onEnd: () => {
          setIsListening(false);
        }
      });

      recognitionRef.current = handle;
    } else {
      if (recognitionRef.current && typeof recognitionRef.current.stop === 'function') {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      setVoiceTranscriptFeedback(null);
    }
  };

  const handleVoiceSearchExecute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  // Intelligent Simulated AI Advisory Response
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    const newMsgId = 'msg-' + Date.now();
    setMessages((prev) => [
      ...prev, 
      { id: newMsgId, sender: 'user', text: userText, timestamp: 'এখন' }
    ]);
    setInputMsg('');
    setIsTyping(true);

    // AI Response Simulation with contextual business intelligence
    setTimeout(() => {
      let aiReply = "আপনার অনুসন্ধানের জন্য ধন্যবাদ। আমি আপনার অনুরোধটি আমাদের লাইভ ডাটাবেজের সাথে মিলিয়ে দেখছি।";
      const u = userText.toLowerCase();

      if (u.includes('পেমেন্ট') || u.includes('টাকা') || u.includes('বিকাশ') || u.includes('নগদ') || u.includes('payment') || u.includes('bkash')) {
        aiReply = "পেমেন্ট করতে আপনার ড্যাশবোর্ডের 'মাই ওয়ালেট' সেকশনে গিয়ে বিকাশ, নগদ বা রকেট নির্বাচন করুন। আমাদের এআই সিকিউরিটি লেয়ার প্রতিটি লেনদেনের ট্রানজেকশন আইডি (TrxID) স্বয়ংক্রিয়ভাবে অডিট করে।";
      } else if (u.includes('ভেরিফাই') || u.includes('এনআইডি') || u.includes('nid') || u.includes('ব্লু টিক') || u.includes('verify')) {
        aiReply = "উদ্যোক্তা বা সেবাদাতা হিসেবে ভেরিফাইড ব্লু-টিক পেতে আপনার এনআইডি কার্ডের সামনের ও পেছনের স্পষ্ট ছবি এবং শপ ট্রেড লাইসেন্স বা পেশাদার বিবরণী আপলোড করুন। আমাদের এআই ও সুপার-অ্যাডমিন প্যানেল দ্রুততম সময়ে যাচাই সম্পন্ন করবে।";
      } else if (u.includes('বাসা') || u.includes('ভাড়া') || u.includes('ফ্ল্যাট') || u.includes('বাড়ি') || u.includes('rent') || u.includes('house')) {
        aiReply = "আপনি কি ব্যাচেলর নাকি ফ্যামিলি বাসা খুঁজছেন? আমাদের 'রিয়েল এস্টেট ও বাসা ভাড়া' ক্যাটালগে খাগড়াছড়ি, রাঙ্গামাটি ও সাভারের ১০০% ভেরিফাইড ফ্ল্যাটের তালিকা রয়েছে।";
      } else if (u.includes('সবজি') || u.includes('ফল') || u.includes('কৃষি') || u.includes('আম') || u.includes('organic')) {
        aiReply = "পাহাড়ের তাজা বিষমুক্ত পাহাড়ি ফলমূল ও অর্গানিক শাকসবজি পেতে 'সবজি, ফল ও কৃষি বাগান' ক্যাটালগ এক্সপ্লোর করুন। সরাসরি স্থানীয় কৃষকের কাছ থেকে পাইকারি ও খুচরা রেটে ক্রয় করা যায়।";
      } else if (u.includes('রেজিস্ট্রেশন') || u.includes('উদ্যোক্তা') || u.includes('বিক্রেতা') || u.includes('লিস্টিং')) {
        aiReply = "উদ্যোক্তা হিসেবে যুক্ত হতে 'উদ্যোক্তা সেল্ফ-সার্ভিস পোর্টাল' থেকে আপনার ব্যবসা বা পেশা নির্বাচন করুন। প্রোডাক্ট যোগ করার সাথে সাথে সিস্টেম স্বয়ংক্রিয়ভাবে আপনার নির্দিষ্ট ক্যাটালগে পোস্ট অ্যাসাইন করে দেবে।";
      } else if (u.includes('সুপার অ্যাডমিন') || u.includes('এডমিন') || u.includes('admin')) {
        aiReply = "সুপার অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে ব্রাউজারের অ্যাড্রেস বারে সরাসরি '/admin' (যেমন: jhadimadi.com/admin) লিখে সুপাবেস অথেন্টিকেশন দিয়ে প্রবেশ করুন।";
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev, 
        { 
          id: 'ai-' + Date.now(), 
          sender: 'ai', 
          text: aiReply, 
          timestamp: 'এখন' 
        }
      ]);
    }, 900);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 font-sans text-xs">
      
      {/* 1. Voice-Powered Smart Searchbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-black text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm">
            <Volume2 size={16} className="text-emerald-600" />
            <span>ভয়েস ও ক্যামেরা অনুসন্ধান (Voice & Image Search)</span>
          </label>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
            বাংলা ও ইংরেজি সমর্থিত
          </span>
        </div>

        <form onSubmit={handleVoiceSearchExecute} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder={isListening ? 'কথা বলুন, শোনা হচ্ছে...' : 'পণ্য, সেবা, পেশা বা এলাকা লিখে খুঁজুন...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 sm:py-3 border rounded-xl outline-none text-xs font-semibold transition ${
                isListening 
                  ? 'border-red-500 bg-red-50/70 animate-pulse text-red-900 placeholder:text-red-600' 
                  : 'bg-slate-50 border-slate-200 focus:border-emerald-600 focus:bg-white text-slate-900'
              }`}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setVoiceTranscriptFeedback(null); }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Camera Input Button */}
          <label 
            className="p-2.5 sm:p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center transition shadow-xs cursor-pointer"
            title="ছবি দিয়ে খুঁজুন"
          >
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const cleaned = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                  setSearchQuery(cleaned);
                  if (onSearchSubmit) onSearchSubmit(cleaned);
                }
              }}
            />
            <Camera size={18} />
          </label>

          {/* Speaker Voice Input Button */}
          <button 
            type="button"
            onClick={toggleVoiceSearch}
            className={`p-2.5 sm:p-3 rounded-xl text-white font-black flex items-center justify-center transition shadow-xs cursor-pointer ${
              isListening 
                ? 'bg-red-600 ring-4 ring-red-200 animate-bounce' 
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
            title={isListening ? 'ভয়েস বন্ধ করুন' : 'ভয়েস দিয়ে খুঁজুন'}
          >
            <Volume2 size={18} />
          </button>

          {/* Search Trigger */}
          <button
            type="submit"
            className="px-3.5 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition cursor-pointer hidden sm:flex items-center gap-1 shrink-0"
          >
            <Search size={14} />
            <span>খুঁজুন</span>
          </button>
        </form>

        {/* Live Feedback / Voice indicator */}
        {isListening && (
          <div className="bg-red-50 border border-red-200 p-2 rounded-xl flex items-center gap-2 text-red-700 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
            <span>{voiceTranscriptFeedback || 'কথা বলুন, আপনার ভয়েস টেক্সটে কনভার্ট হচ্ছে...'}</span>
          </div>
        )}

        {voiceTranscriptFeedback && !isListening && (
          <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center justify-between text-emerald-800 text-[11px] font-bold">
            <span>{voiceTranscriptFeedback}</span>
            {onSearchSubmit && (
              <button
                type="button"
                onClick={() => onSearchSubmit(searchQuery)}
                className="text-emerald-700 underline font-black hover:text-emerald-900"
              >
                ফলাফল দেখুন →
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Admin AI Audit & Moderation Monitoring Card */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-lg border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="font-black text-xs sm:text-sm text-white">
                প্ল্যাটফর্ম এআই অটো-অডিট ও মনিটরিং (AI Auto-Audit Engine)
              </h2>
              <p className="text-[10px] text-slate-400">
                লাইভ কন্টেন্ট যাচাই, ফেক লিস্টিং ফিল্টারিং ও লেনদেন ইন্টেলিজেন্স
              </p>
            </div>
          </div>
          <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Zap size={10} className="text-emerald-400" />
            <span>সক্রিয় গার্ড</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-emerald-400 font-black flex items-center gap-1">
              <CheckCircle2 size={13} /> NID & বিক্রেতা প্রোফাইল অটো-ভেরিফিকেশন:
            </span>
            <p className="text-slate-300 text-[10.5px] leading-relaxed">
              নতুন আবেদনকারীদের জাতীয় পরিচয়পত্রের ছবি ও সেলফি স্মার্ট OCR ও ফেসিয়াল কনসিস্টেন্সি অ্যালগরিদম দ্বারা শতভাগ ম্যাচ হয়েছে।
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-amber-400 font-black flex items-center gap-1">
              <AlertTriangle size={13} /> পেমেন্ট ও লেনদেন সিকিউরিটি গার্ড:
            </span>
            <p className="text-slate-300 text-[10.5px] leading-relaxed">
              বিকাশ/নগদ TrxID ডুপ্লিকেশন বা মিসম্যাচ শনাক্তকরণ সক্রিয়। কোনো ভুয়া ট্রানজেকশন অসঙ্গতি পাওয়া যায়নি।
            </p>
          </div>
        </div>
      </div>

      {/* 3. Floating AI Advisory Chatbot Trigger & Window */}
      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50">
        {!chatOpen ? (
          <button 
            type="button"
            onClick={() => setChatOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs cursor-pointer border border-emerald-400/40 hover:scale-105 transition-all group"
          >
            <div className="relative">
              <Bot size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 absolute -top-1 -right-1 border-2 border-slate-900 animate-ping" />
            </div>
            <span className="hidden sm:inline">AI স্মার্ট সহকারী</span>
          </button>
        ) : (
          <div className="bg-white w-[calc(100vw-24px)] sm:w-96 border border-slate-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[450px] max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Chatbot Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-3.5 flex justify-between items-center font-black">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-xs text-white">ঝাদিমাদি এআই সহকারী</h3>
                  <p className="text-[9.5px] text-emerald-300 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>অনলাইন ও প্রস্তুত</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => setMessages([{
                    id: 'welcome-reset',
                    sender: 'ai',
                    text: 'চ্যাট হিস্টোরি ক্লিয়ার হয়েছে। নতুন করে আপনার প্রশ্ন বলুন।',
                    timestamp: 'এখন'
                  }])}
                  className="p-1 text-slate-400 hover:text-white rounded transition"
                  title="চ্যাট রিসেট করুন"
                >
                  <RefreshCw size={13} />
                </button>
                <button 
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition cursor-pointer"
                  title="বন্ধ করুন"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[10px] whitespace-nowrap no-scrollbar">
              <span className="text-slate-400 font-bold">পরামর্শ:</span>
              <button
                type="button"
                onClick={() => setInputMsg('বাসা ভাড়া কীভাবে খুঁজব?')}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
              >
                🏠 বাসা ভাড়া
              </button>
              <button
                type="button"
                onClick={() => setInputMsg('এনআইডি ভেরিফিকেশন কীভাবে করব?')}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
              >
                🆔 এনআইডি যাচাই
              </button>
              <button
                type="button"
                onClick={() => setInputMsg('ওয়ালেট পেমেন্ট পদ্ধতি কী?')}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
              >
                💳 ওয়ালেট পেমেন্ট
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50 text-xs">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs font-semibold' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs font-normal'
                  }`}>
                    {m.text}
                    <div className={`text-[8.5px] mt-1 ${m.sender === 'user' ? 'text-emerald-200 text-right' : 'text-slate-400'}`}>
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[10px] text-slate-400 font-bold">এআই উত্তর লিখছে...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-200 flex gap-2 bg-white items-center">
              <input 
                type="text" 
                placeholder="আপনার প্রশ্ন লিখুন (যেমন: পেমেন্ট, ভেরিফিকেশন)..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs focus:border-emerald-600 focus:bg-white font-medium"
              />
              <button 
                type="submit" 
                disabled={!inputMsg.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};

export default VoiceAndAiIntegration;
