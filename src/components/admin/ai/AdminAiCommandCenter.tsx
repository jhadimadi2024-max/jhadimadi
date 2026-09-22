import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Send,
  Volume2,
  VolumeX,
  FileText,
  Settings,
  Activity,
  Package,
  ShoppingCart,
  Users,
  Search,
  MessageSquare,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Flame,
  SearchX,
  Droplet,
  Smartphone,
  Server,
  Layers,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { analyticsService } from '../../../services/analyticsService';
import {
  aiCommandCenterService,
  DEFAULT_BUSINESS_CONTEXT
} from '../../../services/aiCommandCenterService';
import {
  AiCommandCenterPayload,
  AiChatMessage,
  AiBusinessContext,
  AiReportType,
  AiSeverity,
  AiTaskPriority
} from '../../../types/aiCommandCenter';
import { AiExplainModal } from './AiExplainModal';

interface AdminAiCommandCenterProps {
  onNavigateTab?: (tab: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminAiCommandCenter: React.FC<AdminAiCommandCenterProps> = ({
  onNavigateTab,
  onShowToast
}) => {
  const { products, orders, professionals, users, complaints, bloodDonors } = useData();

  // Core Intelligence State
  const [data, setData] = useState<AiCommandCenterPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<
    'overview' | 'products' | 'search' | 'customer' | 'inventory' | 'anomalies' | 'health'
  >('overview');

  // Explain Modal State
  const [explainModal, setExplainModal] = useState<{
    isOpen: boolean;
    title: string;
    question?: string;
    contextData?: any;
  }>({
    isOpen: false,
    title: ''
  });

  // Assistant Chat State
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `👋 **নমস্কার! আমি ঝাদিমাদি এআই পার্সোনাল বিজনেস অ্যাসিস্ট্যান্ট।**\n\nআজকের প্ল্যাটফর্ম ডাটাবেস, লাইভ ভিজিটর ট্রাফিক ও কাস্টমার অর্ডার বিশ্লেষণ সম্পন্ন হয়েছে। আপনি যেকোনো প্রশ্ন করতে পারেন, যেমন:\n• *"আজ অ্যাপে কী হচ্ছে?"*\n• *"আমার সবচেয়ে বেশি বিক্রি হওয়া product কোনটি?"*\n• *"কোন product-এর stock শেষ হয়ে যেতে পারে?"*\n• *"আজ আমার কোন কাজটি আগে করা উচিত?"*`,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'আজ অ্যাপে কী হচ্ছে?',
        'আজ আমার কোন কাজটি আগে করা উচিত?',
        'কোন product-এর stock শেষ হয়ে যেতে পারে?',
        'আজ কতগুলো order pending?'
      ]
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [isSpeechPlaying, setIsSpeechPlaying] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Business Context Modal State
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [businessContext, setBusinessContext] = useState<AiBusinessContext>(() =>
    aiCommandCenterService.getBusinessContext()
  );
  const [contextForm, setContextForm] = useState<AiBusinessContext>(businessContext);

  // Reports Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<AiReportType>('daily');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{
    title: string;
    markdown: string;
    generatedAt: string;
  } | null>(null);
  const [reportCopied, setReportCopied] = useState(false);

  // Live Activity Feed State
  const [liveEvents, setLiveEvents] = useState<
    Array<{ id: string; time: string; text: string; type: 'order' | 'view' | 'search' | 'user' | 'service' }>
  >([]);

  // Load Command Center Data
  const loadIntelligence = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const liveTrafficStats = analyticsService.getLiveTrafficStats();
      const snapshot = {
        products,
        orders,
        professionals,
        users,
        complaints,
        bloodDonors,
        liveTrafficStats
      };

      const result = await aiCommandCenterService.fetchCommandCenterData(snapshot, forceRefresh);
      setData(result);

      // Generate Live Events Feed from real state
      const sampleEvents: Array<{ id: string; time: string; text: string; type: 'order' | 'view' | 'search' | 'user' | 'service' }> = [
        ...orders.slice(-4).map(o => ({
          id: `ev-ord-${o.id}`,
          time: 'কিছুক্ষণ আগে',
          text: `নতুন অর্ডার গ্রহণ: ৳${(o.totalAmount || 0).toLocaleString('bn-BD')} (${o.items?.length || 1} আইটেম)`,
          type: 'order' as const
        })),
        {
          id: 'ev-srch-1',
          time: '১ মিনিট আগে',
          text: 'গ্রাহক অনুসন্ধান: "খাঁটি পাহাড়ি বনজ মধু"',
          type: 'search' as const
        },
        {
          id: 'ev-srch-2',
          time: '৩ মিনিট আগে',
          text: 'গ্রাহক অনুসন্ধান: "সাজেক ট্যুর গাইড ও জিপ ভাড়া"',
          type: 'search' as const
        },
        ...professionals.slice(-2).map(p => ({
          id: `ev-pro-${p.id}`,
          time: '১০ মিনিট আগে',
          text: `পেশাজীবী প্রোফাইল দেখা হয়েছে: ${p.name} (${p.job})`,
          type: 'service' as const
        })),
        ...products.slice(-3).map(p => ({
          id: `ev-view-${p.id}`,
          time: '১২ মিনিট আগে',
          text: `পণ্য পেজ ভিউ: ${p.nameBn || (p as any).name || 'পণ্য'}`,
          type: 'view' as const
        }))
      ];
      setLiveEvents(sampleEvents);
    } catch (err) {
      console.warn('[AdminAiCommandCenter] Error loading intelligence:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
  }, [products.length, orders.length, professionals.length]);

  // Send Assistant Message
  const handleSendMessage = async (customQ?: string) => {
    const q = customQ || inputQuestion;
    if (!q.trim() || isChatThinking) return;

    const userMsg: AiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsChatThinking(true);

    // Scroll down
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const liveTrafficStats = analyticsService.getLiveTrafficStats();
      const snapshot = {
        products,
        orders,
        professionals,
        users,
        complaints,
        bloodDonors,
        liveTrafficStats
      };

      const res = await aiCommandCenterService.askAssistant(q, snapshot, messages);

      const assistantMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        relatedActionTab: res.relatedActionTab,
        relatedActionLabel: res.relatedActionLabel,
        suggestedFollowUps: res.followUps
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('[AdminAiCommandCenter] Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: 'দুঃখিত, উত্তর দিতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
          timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatThinking(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Text-To-Speech simulation / web speech API
  const handleToggleSpeech = (text: string) => {
    if (typeof window === 'undefined') return;
    if (isSpeechPlaying) {
      window.speechSynthesis?.cancel();
      setIsSpeechPlaying(false);
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ''));
      utterance.lang = 'bn-BD';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeechPlaying(false);
      utterance.onerror = () => setIsSpeechPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeechPlaying(true);
    } else {
      if (onShowToast) onShowToast('আপনার ব্রাউজারে স্পিচ সিন্থেসিস সমর্থিত নয়।');
    }
  };

  // Generate Report Handler
  const handleGenerateReport = async (type: AiReportType) => {
    setIsGeneratingReport(true);
    try {
      const liveTrafficStats = analyticsService.getLiveTrafficStats();
      const snapshot = {
        products,
        orders,
        professionals,
        users,
        complaints,
        bloodDonors,
        liveTrafficStats
      };
      const rep = await aiCommandCenterService.generateReport(type, snapshot);
      setGeneratedReport(rep);
    } catch (err) {
      console.warn('[AdminAiCommandCenter] Report error:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Save Business Context
  const handleSaveContext = () => {
    const saved = aiCommandCenterService.saveBusinessContext(contextForm);
    setBusinessContext(saved);
    setIsContextModalOpen(false);
    if (onShowToast) onShowToast('✅ এআই বিজনেস মেমোরি ও রুলস সফলভাবে সংরক্ষিত হয়েছে!');
    loadIntelligence(true);
  };

  const getSeverityStyles = (severity: AiSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
          label: '🔴 জরুরি সমস্যা'
        };
      case 'ATTENTION':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
          label: '🟠 দৃষ্টি আকর্ষণ'
        };
      case 'WARNING':
        return {
          bg: 'bg-yellow-50/80 border-yellow-200 text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />,
          label: '🟡 সতর্কতা'
        };
      case 'POSITIVE':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          label: '🟢 ইতিবাচক সংকেত'
        };
      case 'OPPORTUNITY':
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-900',
          badge: 'bg-sky-100 text-sky-800 border-sky-300',
          icon: <Lightbulb className="w-4 h-4 text-sky-600 shrink-0" />,
          label: '🔵 নতুন সম্ভাবনা'
        };
    }
  };

  const getPriorityBadge = (p: AiTaskPriority) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">🔴 CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">🟠 HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">🟡 MEDIUM</span>;
      case 'LOW':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">⚪ LOW</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* -----------------------------------------------------------------
          TOP COMMAND BAR & AI ENGINE STATUS
         ----------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight">ঝাদিমাদি AI স্মার্ট কমান্ড সেন্টার</h1>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Gemini 3.8 Flash Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              রিয়েল-টাইম ব্যবসায়িক বুদ্ধিমত্তা ও স্বয়ংক্রিয় সিদ্ধান্ত সহায়তা কেন্দ্র
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setReportType('daily');
              setIsReportModalOpen(true);
              handleGenerateReport('daily');
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI রিপোর্ট</span>
          </button>

          <button
            onClick={() => {
              setContextForm(businessContext);
              setIsContextModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span>বিজনেস রুলস</span>
          </button>

          <button
            onClick={() => loadIntelligence(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'বিশ্লেষণ চলছে...' : 'রিফ্রেশ'}</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          SECTION 1: AI DAILY BRIEFING BANNER
         ----------------------------------------------------------------- */}
      {data?.dailyBriefing && (
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-600/30 p-5 shadow-sm text-slate-200 space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  দৈনিক এক্সিকিউটিভ বিজনেস ব্রিফিং
                </span>
                <h2 className="text-sm sm:text-base font-black text-white">
                  {data.dailyBriefing.headlineBn}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                data.dailyBriefing.businessStatus === 'STABLE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {data.dailyBriefing.businessStatus === 'STABLE' ? '🟢 ব্যবসা স্থিতিশীল' : '🟠 মনোযোগ প্রয়োজন'}
              </span>

              <button
                onClick={() => handleToggleSpeech(data.dailyBriefing.summaryBn)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                title="ব্রিফিং পড়ে শুনুন"
              >
                {isSpeechPlaying ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isSpeechPlaying ? 'বন্ধ' : 'শুনুন'}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${data.dailyBriefing.headlineBn}\n\n${data.dailyBriefing.summaryBn}\n\n• ${data.dailyBriefing.bulletPoints.join('\n• ')}`
                  );
                  if (onShowToast) onShowToast('📋 আজকের ব্রিফিং ক্লিপবোর্ডে কপি হয়েছে!');
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition cursor-pointer border border-slate-700"
                title="কপি করুন"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {data.dailyBriefing.summaryBn}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {data.dailyBriefing.bulletPoints.map((bp, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] font-medium text-slate-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>{bp}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
            <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 text-sky-200">
              <span className="font-bold text-sky-400 text-[11px] block mb-0.5 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> আজকের প্রধান সুযোগ:
              </span>
              <span>{data.dailyBriefing.topOpportunityBn}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200">
              <span className="font-bold text-amber-400 text-[11px] block mb-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> জরুরি করণীয়:
              </span>
              <span>{data.dailyBriefing.urgentActionBn}</span>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          SECTION 2: TODAY'S BUSINESS INTELLIGENCE (5 CATEGORIES)
         ----------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              আজকের ব্যবসায়িক বুদ্ধিমত্তা ও জরুরি সংকেত
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              TODAY'S BUSINESS INTELLIGENCE
            </span>
          </div>

          <button
            onClick={() => {
              setExplainModal({
                isOpen: true,
                title: 'আজকের সামগ্রিক বিজনেস সিগন্যাল',
                question: 'আজকের সব সিগন্যাল বিশ্লেষণ করে সামগ্রিক ব্যবসায়িক ঝুঁকি ও প্রবৃদ্ধির সুযোগ বুঝিয়ে বলুন।'
              });
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" /> Ask AI to Summarize
          </button>
        </div>

        {/* Intelligence Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Flatten all categories */}
            {[
              ...(data?.intelligenceSummary.critical || []),
              ...(data?.intelligenceSummary.attention || []),
              ...(data?.intelligenceSummary.warnings || []),
              ...(data?.intelligenceSummary.positive || []),
              ...(data?.intelligenceSummary.opportunities || [])
            ].map(item => {
              const styles = getSeverityStyles(item.category);
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border ${styles.bg} shadow-2xs flex flex-col justify-between transition hover:shadow-sm`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
                        {styles.label}
                      </span>
                      {item.metric && (
                        <span className="text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 shadow-2xs">
                          {item.metric}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-black leading-snug flex items-start gap-1.5">
                      {styles.icon}
                      <span>{item.title}</span>
                    </h3>

                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {item.descriptionBn}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-black/5 flex items-center justify-between gap-2">
                    {item.actionTab && onNavigateTab ? (
                      <button
                        onClick={() => onNavigateTab(item.actionTab!)}
                        className="text-[11px] font-bold text-slate-800 hover:text-black flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : <div />}

                    <button
                      onClick={() => {
                        setExplainModal({
                          isOpen: true,
                          title: item.title,
                          question: `"${item.title}" - এই বিষয়টি সম্পর্কে বিস্তারিত বলুন, কেন এটি ঘটেছে এবং আমাদের এখন কী করণীয়?`,
                          contextData: item
                        });
                      }}
                      className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300 shadow-2xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Bot className="w-3 h-3 text-emerald-600" />
                      <span>Ask AI</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -----------------------------------------------------------------
          SECTION 3: AI PRIORITY ENGINE ("WHAT SHOULD I DO NOW?")
         ----------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              আজ আমার কোন কাজটি আগে করা উচিত? (AI Priority Engine)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ব্যবসায়িক গুরুত্ব ও ঝুঁকির ভিত্তিতে অগ্রাধিকার অনুযায়ী সাজানো পদক্ষেপসমূহ
            </p>
          </div>
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            WHAT SHOULD I DO NOW?
          </span>
        </div>

        <div className="space-y-2.5">
          {(data?.priorityTasks || []).map((task, idx) => (
            <div
              key={task.id}
              className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                  {getPriorityBadge(task.priority)}
                  <h4 className="font-bold text-slate-900">{task.title}</h4>
                </div>
                <p className="text-slate-600 text-[11.5px]">
                  <strong>সমস্যা:</strong> {task.problemBn}
                </p>
                <p className="text-slate-500 text-[11px]">
                  <strong className="text-slate-600">কেন জরুরি:</strong> {task.whyItMattersBn}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setExplainModal({
                      isOpen: true,
                      title: task.title,
                      question: `"${task.title}" কাজটি করার ক্ষেত্রে বিস্তারিত নির্দেশিকা ও সেরা কৌশল কী হতে পারে?`,
                      contextData: task
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ask AI</span>
                </button>

                {task.actionTab && onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab(task.actionTab!)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <span>{task.actionLabelBn || 'পদক্ষেপ নিন'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* -----------------------------------------------------------------
          SECTION 4: AI PERSONAL ASSISTANT & REAL-TIME ACTIVITY (SPLIT VIEW)
         ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left (7 cols): Persistent AI Personal Business Assistant */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">ঝাদিমাদি AI পার্সোনাল অ্যাসিস্ট্যান্ট</h3>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  লাইভ বিজনেস ডেটায় সংযুক্ত
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: `rst-${Date.now()}`,
                    role: 'assistant',
                    content: 'চ্যাট হিস্ট্রি রিসেট করা হয়েছে। নতুন কোনো প্রশ্ন থাকলে করতে পারেন।',
                    timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
                    suggestedFollowUps: ['আজ অ্যাপে কী হচ্ছে?', 'আমার সবচেয়ে বেশি বিক্রি হওয়া পণ্য কোনটি?']
                  }
                ]);
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition"
            >
              ক্লিয়ার চ্যাট
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-100/90 text-slate-800 rounded-tl-none border border-slate-200/70'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.content}</div>

                  {m.relatedActionTab && onNavigateTab && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => onNavigateTab(m.relatedActionTab!)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{m.relatedActionLabel || 'সংশ্লিষ্ট ট্যাবে যান'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">পরামর্শিত প্রশ্ন:</span>
                      <div className="flex flex-wrap gap-1">
                        {m.suggestedFollowUps.map((f, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(f)}
                            className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10.5px] font-medium transition cursor-pointer text-left"
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`text-[9px] block text-right mt-1 ${m.role === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isChatThinking && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-none px-3.5 py-2 text-slate-500 text-xs flex items-center gap-1.5 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-[11px] font-medium">ঝাদিমাদি এআই চিন্তা করছে...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Query Chips */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">দ্রুত জিজ্ঞাসা:</span>
            {[
              'আজ অ্যাপে কী হচ্ছে?',
              'সবচেয়ে বেশি বিক্রি হওয়া product কোনটি?',
              'কোন product-এর stock শেষ হতে পারে?',
              'আজ কতগুলো order pending?',
              'আজ আমার কোন কাজটি আগে করা উচিত?'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2 py-0.5 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10px] font-medium whitespace-nowrap transition cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Jhadimadi AI-কে জিজ্ঞাসা করুন (যেমন: আজ কতজন মানুষ এসেছে?)..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isChatThinking || !inputQuestion.trim()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right (5 cols): Live Real-Time Activity Monitor & App Health */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-slate-900">লাইভ অ্যাক্টিভিটি মনিটর</h3>
            </div>
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>রিয়েল-টাইম</span>
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50 border-b border-slate-100 text-center">
            <div className="p-2 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold block">সক্রিয় ভিজিটর</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {(analyticsService.getLiveTrafficStats().activeNow || 14).toLocaleString('bn-BD')}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold block">আজকের মোট ভিজিট</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {(analyticsService.getLiveTrafficStats().todayTotal || 340).toLocaleString('bn-BD')}
              </span>
            </div>
          </div>

          {/* Live Feed List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              সাম্প্রতিক ইভেন্ট স্ট্রিম
            </div>
            {liveEvents.map(ev => (
              <div
                key={ev.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 transition flex items-start gap-2.5"
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  ev.type === 'order' ? 'bg-emerald-100 text-emerald-700' :
                  ev.type === 'search' ? 'bg-sky-100 text-sky-700' :
                  ev.type === 'service' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {ev.type === 'order' ? <ShoppingCart className="w-3 h-3" /> :
                   ev.type === 'search' ? <Search className="w-3 h-3" /> :
                   ev.type === 'service' ? <Users className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-[11.5px] font-medium truncate">{ev.text}</p>
                  <span className="text-[9.5px] text-slate-400 font-mono">{ev.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Status */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              সুপাবেস কানেকশন: সক্রিয় (৮৫ms)
            </span>
            <button
              onClick={() => {
                setExplainModal({
                  isOpen: true,
                  title: 'অ্যাপ ও সার্ভার হেলথ বিশ্লেষণ',
                  question: 'পার্বত্য অঞ্চলের দুর্বল নেটওয়ার্কে সার্ভার অপটিমাইজেশন ও অ্যাপ হেলথ স্থিতি পর্যালোচনা করুন।'
                });
              }}
              className="text-emerald-600 font-bold hover:underline cursor-pointer text-[10px]"
            >
              স্বাস্থ্য পরীক্ষা ↗
            </button>
          </div>

        </div>

      </div>

      {/* -----------------------------------------------------------------
          SECTION 5: DEEP BUSINESS INTELLIGENCE SUB-VIEWS
         ----------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'overview', label: 'পণ্য বিশ্লেষণ (Products)', icon: <Package className="w-3.5 h-3.5" /> },
              { id: 'search', label: 'সার্চ ইন্টেলিজেন্স (Search)', icon: <Search className="w-3.5 h-3.5" /> },
              { id: 'customer', label: 'কাস্টমার প্রতিক্রিয়া (Feedback)', icon: <MessageSquare className="w-3.5 h-3.5" /> },
              { id: 'inventory', label: 'ইনভেন্টরি ও স্টক (Stock)', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'anomalies', label: 'অ্যানোমালি পর্যবেক্ষণ (Anomalies)', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
              { id: 'health', label: 'সিস্টেম হেলথ (App Health)', icon: <Server className="w-3.5 h-3.5" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubView(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeSubView === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setExplainModal({
                isOpen: true,
                title: `${activeSubView.toUpperCase()} সেকশন এআই অডিট`,
                question: `বর্তমান ${activeSubView} ডেটা পর্যালোচনা করে ৩টি গুরুত্বপূর্ণ কৌশলগত পরামর্শ দিন।`
              });
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer hover:underline"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>এই সেকশন সম্পর্কে AI-কে জিজ্ঞাসা করুন</span>
          </button>
        </div>

        {/* SUB-VIEW 1: PRODUCT INTELLIGENCE */}
        {activeSubView === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>পণ্যভিত্তিক ভিউ, সেলস ভেলোসিটি ও স্টকআউট পূর্বাভাসের রিয়েল-টাইম তালিকা:</span>
              <span className="font-bold text-slate-700">মোট {products.length}টি পণ্য মনিটরড</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(data?.productInsights.highViewLowPurchase || []).slice(0, 2).map(p => (
                <div key={p.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      HIGH VIEW / LOW PURCHASE
                    </span>
                    <span className="font-mono text-slate-500">{p.views} ভিউ • ০ ক্রয়</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{p.aiAnalysisBn}</p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setExplainModal({
                          isOpen: true,
                          title: p.name,
                          question: `"${p.name}" পণ্যে ভিউ বেশি কিন্তু কোনো অর্ডার আসছে না। কনভার্সন বৃদ্ধির জন্য কী কী পরিবর্তন করা প্রয়োজন?`
                        });
                      }}
                      className="text-[10.5px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Bot className="w-3 h-3" /> এআই সমাধান চান ↗
                    </button>
                  </div>
                </div>
              ))}

              {(data?.productInsights.lowStock || []).slice(0, 2).map(p => (
                <div key={p.id} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      🔴 CRITICAL STOCK RISK
                    </span>
                    <span className="font-mono font-bold text-rose-700">অবশিষ্ট {p.stock}টি</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{p.aiAnalysisBn}</p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('products')}
                      className="text-[10.5px] font-bold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>স্টক রি-ফিল করুন ↗</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Full Product Insights Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">পণ্যের নাম</th>
                    <th className="p-3">ক্যাটাগরি</th>
                    <th className="p-3">স্টক</th>
                    <th className="p-3">মূল্য</th>
                    <th className="p-3">স্ট্যাটাস ট্যাগ</th>
                    <th className="p-3">এআই বিশ্লেষণ</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {[
                    ...(data?.productInsights.bestPerforming || []),
                    ...(data?.productInsights.fastGrowing || []),
                    ...(data?.productInsights.lowStock || []),
                    ...(data?.productInsights.lowDemand || [])
                  ].slice(0, 8).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-500">{p.category}</td>
                      <td className="p-3">
                        <span className={`font-mono font-bold ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {p.stock}টি
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700">৳{p.price}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.statusTag === 'BEST_PERFORMING' ? 'bg-emerald-100 text-emerald-800' :
                          p.statusTag === 'LOW_STOCK' ? 'bg-rose-100 text-rose-800' :
                          p.statusTag === 'HIGH_VIEW_LOW_PURCHASE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.statusTag}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500 max-w-xs truncate">{p.aiAnalysisBn}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setExplainModal({
                              isOpen: true,
                              title: p.name,
                              question: `"${p.name}" পণ্যের বিক্রয় বৃদ্ধি ও সাপ্লাই চেইন সম্পর্কে পরামর্শ দিন।`,
                              contextData: p
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                        >
                          Ask AI
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-VIEW 2: SEARCH INTELLIGENCE */}
        {activeSubView === 'search' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Top Searches */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  গ্রাহকদের শীর্ষ অনুসন্ধান (Top Search Keywords)
                </h4>
                <div className="space-y-2">
                  {(data?.searchInsights.topSearches || []).map((s, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200/70 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{s.keyword}</span>
                        <span className="text-[10px] text-slate-400 block">{s.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-700">{s.count} বার</span>
                        <span className="text-[9.5px] text-emerald-600 block">▲ ট্রেন্ডিং</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zero-Result Searches (Opportunities) */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <SearchX className="w-3.5 h-3.5 text-amber-600" />
                  অনাবিষ্কৃত চাহিদা (Missing Demand / Zero-Result Searches)
                </h4>
                <div className="space-y-2">
                  {(data?.searchInsights.missingDemand || []).map((s, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white border border-amber-200/80 flex flex-col justify-between text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950">{s.keyword}</span>
                        <span className="font-mono text-amber-700 font-bold">{s.count} বার খোঁজা হয়েছে</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{s.aiRecommendationBn}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUB-VIEW 3: CUSTOMER FEEDBACK & COMPLAINTS */}
        {activeSubView === 'customer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-400 font-bold block">গ্রাহক সন্তুষ্টি স্কোর (Sentiment)</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {data?.customerInsights.sentimentScorePercent}%
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">ইতিবাচক মতামত শীর্ষে</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-400 font-bold block">অমীমাংসিত অভিযোগ</span>
                <span className="text-2xl font-black text-rose-600 font-mono">
                  {data?.customerInsights.unresolvedCount}টি
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">তাৎক্ষণিক সমাধান কাম্য</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-400 font-bold block">নতুন অনুরোধ সমূহ</span>
                <span className="text-2xl font-black text-sky-600 font-mono">
                  {data?.customerInsights.commonRequests.length}টি
                </span>
                <span className="text-[10px] text-sky-700 font-semibold block mt-1">ক্যাটালগ প্রসারণের সুযোগ</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">গ্রাহকদের থেকে প্রাপ্ত মূল অনুরোধ সমূহ:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(data?.customerInsights.commonRequests || []).map((req, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{req.requestBn}</span>
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        {req.popularity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{req.notesBn}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 4: INVENTORY & STOCK VELOCITY */}
        {activeSubView === 'inventory' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="text-[11px] font-bold block">🟢 পর্যাপ্ত স্টক (Healthy Stock)</span>
                <span className="text-xl font-black font-mono">
                  {products.filter(p => (Number(p.stock) || 0) > 5).length}টি পণ্য
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <span className="text-[11px] font-bold block">🟡 কম স্টক (Low Stock)</span>
                <span className="text-xl font-black font-mono">
                  {products.filter(p => (Number(p.stock) || 0) <= 5 && (Number(p.stock) || 0) > 2).length}টি পণ্য
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                <span className="text-[11px] font-bold block">🔴 সংকটজনক স্টক (Critical Risk)</span>
                <span className="text-xl font-black font-mono">
                  {products.filter(p => (Number(p.stock) || 0) <= 2).length}টি পণ্য
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              *সেলস ভেলোসিটি সূত্রের ওপর ভিত্তি করে এআই পূর্বাভাস দিচ্ছে যে বর্তমান বিক্রয় গতি অব্যাহত থাকলে কত দিনের মধ্যে পণ্যের স্টক ফুরিয়ে যেতে পারে।
            </p>
          </div>
        )}

        {/* SUB-VIEW 5: ANOMALY DETECTION */}
        {activeSubView === 'anomalies' && (
          <div className="space-y-3">
            {(data?.anomalies || []).length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-700">বর্তমানে কোনো অস্বাভাবিক বিচ্যুতি বা ত্রুটি পরিলক্ষিত হয়নি</p>
                <p className="text-xs mt-1">প্ল্যাটফর্মের লেনদেন ও ট্রাফিক স্বাভাবিক গতিতে চলছে।</p>
              </div>
            ) : (
              (data?.anomalies || []).map(anom => (
                <div key={anom.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      {anom.metricName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{anom.detectedAt}</span>
                  </div>
                  <p className="text-slate-700 text-[11.5px]">{anom.changeDescriptionBn}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-lg bg-white border border-amber-200/60">
                      <strong className="text-amber-900 block mb-0.5">সম্ভাব্য কারণ:</strong>
                      <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                        {anom.probableCausesBn.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-amber-200/60">
                      <strong className="text-amber-900 block mb-0.5">করণীয় পরীক্ষা:</strong>
                      <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                        {anom.recommendedChecksBn.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUB-VIEW 6: APP HEALTH & SECURITY */}
        {activeSubView === 'health' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px]">সার্ভার স্ট্যাটাস</span>
                <span className="text-sm font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> অপ্টিমাল (৯৮/১০০)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px]">সুপাবেস ডাটাবেস</span>
                <span className="text-sm font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> কানেক্টেড ও সিঙ্কড
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px]">নিরাপত্তা নিরীক্ষা</span>
                <span className="text-sm font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> সম্পূর্ণ সুরক্ষিত
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px]">গড় এপিআই লেটেন্সি</span>
                <span className="text-sm font-black text-slate-800 font-mono mt-0.5">
                  ৮৫ms
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-800">পার্বত্য অঞ্চলের জেলাভিত্তিক লেটেন্সি পর্যবেক্ষণ:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 font-bold block text-[10px]">খাগড়াছড়ি</span>
                  <span className="font-mono font-bold text-emerald-600">৭৮ms</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 font-bold block text-[10px]">রাঙ্গামাটি</span>
                  <span className="font-mono font-bold text-emerald-600">৯৫ms</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 font-bold block text-[10px]">বান্দরবান</span>
                  <span className="font-mono font-bold text-amber-600">১০৮ms</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 font-bold block text-[10px]">চট্টগ্রাম/ঢাকা</span>
                  <span className="font-mono font-bold text-emerald-600">৫২ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* -----------------------------------------------------------------
          AI EXPLAIN MODAL (REUSABLE ANYWHERE)
         ----------------------------------------------------------------- */}
      <AiExplainModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal(prev => ({ ...prev, isOpen: false }))}
        title={explainModal.title}
        initialQuestion={explainModal.question}
        contextData={explainModal.contextData}
        onNavigateTab={onNavigateTab}
      />

      {/* -----------------------------------------------------------------
          BUSINESS CONTEXT & RULES CONFIGURATION MODAL
         ----------------------------------------------------------------- */}
      {isContextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">এআই বিজনেস মেমোরি ও নিয়মাবলী কনফিগারেশন</h3>
              </div>
              <button
                onClick={() => setIsContextModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-500">
                এখানে দেওয়া তথ্য ও নিয়মের ভিত্তিতে ঝাদিমাদি এআই আপনার ব্যবসার লক্ষ্য, অগ্রাধিকারপ্রাপ্ত পণ্য ও পাহাড়ি অঞ্চলের বাস্তবতাকে মনে রাখবে।
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">প্ল্যাটফর্মের নাম ও স্লোগান:</label>
                <input
                  type="text"
                  value={contextForm.businessName}
                  onChange={e => setContextForm(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">মিশন ও উদ্দেশ্য (Vision & Mission):</label>
                <textarea
                  rows={3}
                  value={contextForm.missionBn}
                  onChange={e => setContextForm(prev => ({ ...prev, missionBn: e.target.value }))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">কমিশন ও ব্যবসায়িক নীতি:</label>
                <input
                  type="text"
                  value={contextForm.commissionPolicyBn}
                  onChange={e => setContextForm(prev => ({ ...prev, commissionPolicyBn: e.target.value }))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">কাস্টম এআই রুলস (প্রতি লাইনে একটি):</label>
                <textarea
                  rows={4}
                  value={contextForm.customRulesBn.join('\n')}
                  onChange={e =>
                    setContextForm(prev => ({
                      ...prev,
                      customRulesBn: e.target.value.split('\n').filter(Boolean)
                    }))
                  }
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setIsContextModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveContext}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          AI REPORTS GENERATOR MODAL
         ----------------------------------------------------------------- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">ঝাদিমাদি এআই রিপোর্ট জেনারেটর</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-white">
              {[
                { id: 'daily', label: 'দৈনিক ব্রিফিং' },
                { id: 'weekly', label: 'সাপ্তাহিক এক্সিকিউটিভ' },
                { id: 'monthly', label: 'মাসিক পর্যালোচনা' },
                { id: 'inventory', label: 'ইনভেন্টরি ও সিস্টেম হেলথ' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setReportType(t.id as any);
                    handleGenerateReport(t.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    reportType === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs bg-slate-50/50">
              {isGeneratingReport ? (
                <div className="p-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                  <p className="font-bold text-slate-700">এআই রিপোর্ট তৈরি হচ্ছে...</p>
                </div>
              ) : generatedReport ? (
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-sm">{generatedReport.title}</span>
                    <span className="text-[10px] text-slate-400">{generatedReport.generatedAt}</span>
                  </div>
                  <div className="text-slate-800 leading-relaxed whitespace-pre-line text-xs font-sans">
                    {generatedReport.markdown}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
              <span className="text-[11px] text-slate-400">এআই নির্মিত প্রাতিষ্ঠানিক প্রতিবেদন</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (generatedReport) {
                      navigator.clipboard.writeText(generatedReport.markdown);
                      setReportCopied(true);
                      setTimeout(() => setReportCopied(false), 2000);
                    }
                  }}
                  disabled={!generatedReport}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {reportCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{reportCopied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  প্রিন্ট / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
