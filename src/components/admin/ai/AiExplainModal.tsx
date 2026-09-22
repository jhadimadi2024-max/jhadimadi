import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, X, Send, ArrowRight, Check, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { aiCommandCenterService } from '../../../services/aiCommandCenterService';
import { useData } from '../../../context/DataContext';

interface AiExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialQuestion?: string;
  contextData?: any;
  onNavigateTab?: (tab: string) => void;
}

export const AiExplainModal: React.FC<AiExplainModalProps> = ({
  isOpen,
  onClose,
  title,
  initialQuestion,
  contextData,
  onNavigateTab
}) => {
  const { products, orders, professionals, users, complaints, bloodDonors } = useData();
  const [question, setQuestion] = useState(initialQuestion || '');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const [relatedTab, setRelatedTab] = useState<string | undefined>();
  const [relatedLabel, setRelatedLabel] = useState<string | undefined>();
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const executeAsk = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const snapshot = {
        products,
        orders,
        professionals,
        users,
        complaints,
        bloodDonors,
        contextData
      };
      const res = await aiCommandCenterService.askAssistant(q, snapshot);
      setAnswer(res.answer);
      setRelatedTab(res.relatedActionTab);
      setRelatedLabel(res.relatedActionLabel);
      setFollowUps(res.followUps || []);
    } catch (err) {
      console.warn('AI explain error:', err);
      setAnswer('দুঃখিত, এআই উত্তরের সময় সাময়িক ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const defaultQ = initialQuestion || `${title} সম্পর্কে বিস্তারিত বিশ্লেষণ ও করণীয় ব্যাখ্যা করুন।`;
      setQuestion(defaultQ);
      executeAsk(defaultQ);
    } else {
      setAnswer('');
      setFollowUps([]);
    }
  }, [isOpen, initialQuestion, title]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-slate-900 border border-emerald-600/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">ঝাদিমাদি AI বিশ্লেষণ</h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Question Banner */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 font-medium">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">জিজ্ঞাসা:</span>
            {question}
          </div>

          {/* AI Answer */}
          {isLoading ? (
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              <p className="text-slate-300 font-medium text-xs">
                ঝাদিমাদি এআই লাইভ ডাটাবেস ও মেট্রিক বিশ্লেষণ করছে...
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/60 pb-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Sparkles className="w-3 h-3" /> রিয়েল-টাইম বিজনেস ইনসাইট
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(answer);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>

              {/* Render Answer Text with linebreaks */}
              <div className="text-slate-200 leading-relaxed whitespace-pre-line text-[12.5px] font-sans">
                {answer}
              </div>

              {/* Related Tab Action */}
              {relatedTab && onNavigateTab && (
                <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => {
                      onNavigateTab(relatedTab);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <span>{relatedLabel || 'সংশ্লিষ্ট সেকশনে যান'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Follow-up Question Chips */}
          {followUps.length > 0 && !isLoading && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">সম্পর্কিত প্রশ্ন:</span>
              <div className="flex flex-wrap gap-1.5">
                {followUps.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(f);
                      executeAsk(f);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700/60 transition cursor-pointer text-left"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Input Footer for Custom Follow-Up */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeAsk(question)}
            placeholder="আরও কিছু জানতে এআই-কে জিজ্ঞাসা করুন..."
            className="flex-1 bg-slate-900 border border-slate-700/70 rounded-xl px-3.5 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            onClick={() => executeAsk(question)}
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>পাঠান</span>
          </button>
        </div>

      </div>
    </div>
  );
};
