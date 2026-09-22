import React, { useState } from 'react';
import { MASTER_SYSTEM_PROMPT, TECH_SPECS } from '../data/masterPrompt';
import { Language } from '../types';
import { 
  Copy, 
  Check, 
  FileCode2, 
  Download, 
  Sparkles, 
  Terminal, 
  Layers, 
  Database, 
  MapPin, 
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface PromptGeneratorProps {
  lang: Language;
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ lang }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'architecture' | 'customizer'>('prompt');
  
  // Customizer options
  const [techMobile, setTechMobile] = useState('Flutter Cross-Platform (iOS & Android)');
  const [techBackend, setTechBackend] = useState('Node.js / Express.js REST API');
  const [techDb, setTechDb] = useState('PostgreSQL + PostGIS Extension');

  const handleCopy = () => {
    navigator.clipboard.writeText(MASTER_SYSTEM_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([MASTER_SYSTEM_PROMPT], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "Jhadimadi_Master_AI_System_Prompt.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 pb-20 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-800/40 rounded-3xl p-6 md:p-8 space-y-3 shadow-2xl">
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-purple-300 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Master AI Coding System Prompt Workspace</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white">
          Jhadimadi.com — "Master AI System Prompt" (কোডিং প্রম্পট সেন্ট্রাল)
        </h2>
        <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl">
          Cursor AI, Bolt.new, v0, অথবা ChatGPT-4o এ সরাসরি ব্যবহার করার মতো সম্পূর্ণ প্রফেশনাল মাস্টার কোডিং প্রম্পট। ১-ক্লিকে কপি বা ডাউনলোড করুন।
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-purple-950 flex items-center space-x-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'কপি সম্পন্ন হয়েছে (Copied!)' : 'কপি মাস্টার প্রম্পট (Copy Master Prompt)'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer border border-slate-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>ডাউনলোড .TXT প্রম্পট (Download Text File)</span>
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900 rounded-2xl p-1.5">
        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'prompt' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>১. মাস্টার প্রম্পট কোড (Full Master System Prompt)</span>
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'architecture' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>২. টেকনিক্যাল আর্কিটেকচার (Tech Specs)</span>
        </button>
      </div>

      {/* TAB 1: PROMPT VIEWER */}
      {activeTab === 'prompt' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden font-mono shadow-2xl">
          <div className="flex justify-between items-center mb-3 text-slate-400 text-xs border-b border-slate-800 pb-3">
            <span className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>system_prompt_master.markdown</span>
            </span>
            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Cursor / Bolt / v0 Ready
            </span>
          </div>

          <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-[600px] p-2">
            {MASTER_SYSTEM_PROMPT}
          </pre>
        </div>
      )}

      {/* TAB 2: TECH SPECS */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TECH_SPECS.map((spec, i) => (
            <div 
              key={i} 
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block">
                  {spec.label}
                </span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {spec.value}
                </span>
              </div>
              <Sparkles className="w-5 h-5 text-purple-500/40" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
