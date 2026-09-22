import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Search,
  Download,
  Copy,
  Check,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Sliders,
  CheckCheck
} from 'lucide-react';

interface KnowledgeBaseStatus {
  tableName: string;
  totalEntries: number;
  activeCategories: string[];
  isInitialized: boolean;
  hasVectorEmbeddings: boolean;
  vectorDimensions: number;
  sampleEntries: Array<{
    id: string;
    prompt_user: string;
    completion_assistant: string;
    category?: string;
    updated_at?: string;
  }>;
  lastUpdated?: string;
}

export const AdminAiKnowledgeBaseConfig: React.FC = () => {
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedPreviewCount, setParsedPreviewCount] = useState<number | null>(null);
  const [syncMode, setSyncMode] = useState<'update' | 'replace'>('update');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directJsonInputRef = useRef<HTMLInputElement>(null);
  const [directUploadLoading, setDirectUploadLoading] = useState(false);
  const [directUploadToast, setDirectUploadToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Feedback notice state
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{
    count: number;
    updatedCount?: number;
    insertedCount?: number;
    total: number;
    tableName?: string;
    supabaseStatus?: string;
  } | null>(null);

  // Status and database info
  const [kbStatus, setKbStatus] = useState<KnowledgeBaseStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'explorer' | 'schema' | 'test'>('upload');

  // RAG Vector search test state
  const [testQuery, setTestQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    similarityScore: number;
    userQuery: string;
    prompt_user?: string;
    assistantResponse: string;
    completion_assistant?: string;
    category?: string;
  }>>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const getAuthHeaders = () => {
    const token =
      (typeof window !== 'undefined'
        ? sessionStorage.getItem('jhadimadi_admin_token') ||
          localStorage.getItem('jhadimadi_admin_token')
        : '') || 'jhadimadi-super-admin-session';
    return {
      'Authorization': `Bearer ${token}`,
      'X-Admin-Token': token,
      'x-admin-auth': token,
    };
  };

  // Fetch current knowledge base status
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/admin/ai/knowledge-base/status', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setKbStatus(data);
      }
    } catch (e) {
      console.warn('[AI Config] Failed fetching KB status:', e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Validate and parse selected file
  const handleFileSelection = (file: File) => {
    setFileError(null);
    setFeedbackNotice(null);

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.jsonl')) {
      setFileError('ফাইল টাইপ ত্রুটি: শুধুমাত্র .json এবং .jsonl ফাইল আপলোড গ্রহণ করবে।');
      setSelectedFile(null);
      setFileContent('');
      setParsedPreviewCount(null);
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setFileContent(content);

      try {
        let count = 0;
        if (fileName.endsWith('.jsonl')) {
          const lines = content.split('\n').filter(l => l.trim().length > 0);
          count = lines.length;
        } else {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            count = parsed.length;
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.knowledge_base)) count = parsed.knowledge_base.length;
            else if (Array.isArray(parsed.items)) count = parsed.items.length;
            else if (Array.isArray(parsed.data)) count = parsed.data.length;
            else if (Array.isArray(parsed.qa_pairs)) count = parsed.qa_pairs.length;
            else if (Array.isArray(parsed.faqs)) count = parsed.faqs.length;
            else count = 1;
          }
        }
        setParsedPreviewCount(count);
      } catch (err: any) {
        setFileError(`ফাইলের সিনট্যাক্স পার্সিংয়ে সমস্যা হয়েছে: ${err.message}`);
        setParsedPreviewCount(null);
      }
    };
    reader.readAsText(file);
  };

  // Upload and Sync to AI Database
  const handleUploadAndSync = async () => {
    if (!selectedFile || !fileContent) {
      setFileError('অনুগ্রহ করে প্রথমে একটি বৈধ .json বা .jsonl ফাইল নির্বাচন করুন।');
      return;
    }

    setIsUploading(true);
    setFileError(null);
    setFeedbackNotice(null);

    try {
      const response = await fetch('/api/admin/ai/knowledge-base/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          fileContent,
          fileName: selectedFile.name,
          mode: syncMode,
          replaceAll: syncMode === 'replace',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Official feedback notice requested by user
        setFeedbackNotice('Successfully Synced with Jhadimadi AI Knowledge Base!');
        setLastSyncResult({
          count: data.importedCount || data.count,
          updatedCount: data.updatedCount,
          insertedCount: data.insertedCount,
          total: data.totalInStore || data.total,
          tableName: data.tableName || 'ai_knowledge_base',
          supabaseStatus: data.supabaseStatus,
        });

        // Refresh stats
        fetchStatus();

        // Reset file selector
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setFileError(data.message || 'সিঙ্ক ব্যর্থ হয়েছে। অনুগ্রহ করে ফাইল চেক করুন।');
      }
    } catch (err: any) {
      setFileError(`সার্ভার সংযোগে ত্রুটি: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Direct Upload JSON File Handler (Validation, Supabase sync, and AI accessibility)
  const handleDirectJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset feedback
    setDirectUploadToast(null);

    // 1. Client-Side Validation: Ensure only .json files are accepted
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json')) {
      setDirectUploadToast({
        type: 'error',
        message: 'ত্রুটি: শুধুমাত্র বৈধ .json ফাইল গ্রহণযোগ্য (Only valid .json files are accepted).'
      });
      if (directJsonInputRef.current) directJsonInputRef.current.value = '';
      return;
    }

    // 2. Client-Side Validation: Check non-empty file size
    if (file.size === 0) {
      setDirectUploadToast({
        type: 'error',
        message: 'ত্রুটি: ফাইলটি সম্পূর্ণ ফাঁকা (File is empty).'
      });
      if (directJsonInputRef.current) directJsonInputRef.current.value = '';
      return;
    }

    setDirectUploadLoading(true);

    try {
      // 3. Read and parse JSON content client-side
      const text = await file.text();
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(text);
      } catch (jsonErr: any) {
        setDirectUploadToast({
          type: 'error',
          message: `অবৈধ JSON স্ট্রাকচার: ${jsonErr.message}। অনুগ্রহ করে সিনট্যাক্স পরীক্ষা করুন।`
        });
        setDirectUploadLoading(false);
        if (directJsonInputRef.current) directJsonInputRef.current.value = '';
        return;
      }

      // 4. Server-Side Processing & Database Integration (Upsert into Supabase & sync AI knowledge base)
      const response = await fetch('/api/admin/supabase/upload-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          fileContent: text,
          fileName: file.name,
          targetTable: 'ai_knowledge_base',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const count = data.processedCount || data.importedCount || (Array.isArray(parsedJson) ? parsedJson.length : 1);
        setDirectUploadToast({
          type: 'success',
          message: `সফলভাবে আপলোড সম্পন্ন হয়েছে! ${count}টি রেকর্ড Supabase "${data.targetTable || 'ai_knowledge_base'}" টেবিলে সংরক্ষিত হয়েছে এবং AI সিস্টেম গ্রাহকদের প্রশ্নের উত্তরে ব্যবহারের জন্য প্রস্তুত।`
        });
        setFeedbackNotice('Successfully Synced with Jhadimadi AI Knowledge Base & Supabase Database!');
        setLastSyncResult({
          count,
          updatedCount: count,
          insertedCount: 0,
          total: count,
          tableName: data.targetTable || 'ai_knowledge_base',
          supabaseStatus: data.supabaseStatus || 'synced_to_supabase_table',
        });

        // Refresh live status
        fetchStatus();
      } else {
        setDirectUploadToast({
          type: 'error',
          message: data.message || 'আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে ফাইল স্ট্রাকচার চেক করুন।'
        });
      }
    } catch (err: any) {
      setDirectUploadToast({
        type: 'error',
        message: `সার্ভার সংযোগে ত্রুটি: ${err.message}`
      });
    } finally {
      setDirectUploadLoading(false);
      if (directJsonInputRef.current) directJsonInputRef.current.value = '';
    }
  };

  // Run Vector Similarity Test (RAG Simulator)
  const handleRunVectorSearch = async () => {
    if (!testQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/admin/ai/knowledge-base/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          query: testQuery.trim(),
          topK: 3,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResults(data.results || []);
      }
    } catch (e) {
      console.warn('[Vector Search Test Error]:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const supabaseSqlCode = `-- ========================================================
-- JHADIMADI.COM - AI KNOWLEDGE BASE & VECTOR TABLE (SUPABASE)
-- ========================================================

-- 1. Enable Vector Extension (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create ai_knowledge_base Table
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_user TEXT NOT NULL,
    completion_assistant TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create HNSW Vector Index for Instant Cosine Similarity Search
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_embedding 
ON public.ai_knowledge_base 
USING hnsw (embedding vector_cosine_ops);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- 5. Read-only policy for customer chatbot
CREATE POLICY "Public Read Access for Chat RAG" 
ON public.ai_knowledge_base FOR SELECT USING (true);

-- 6. Match Function for RPC similarity search
CREATE OR REPLACE FUNCTION match_ai_knowledge_base(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.35,
    match_count int DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    prompt_user TEXT,
    completion_assistant TEXT,
    category VARCHAR,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.prompt_user,
        k.completion_assistant,
        k.category,
        1 - (k.embedding <=> query_embedding) AS similarity
    FROM public.ai_knowledge_base k
    WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseSqlCode);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  return (
    <div className="space-y-6" id="ai-knowledge-base-config">
      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-7 rounded-3xl border border-purple-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Jhadimadi AI Vector RAG & Database Sync</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              AI Config: নলেজ বেস ও ভেক্টর ডাটাবেজ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              ড্যাশবোর্ড থেকে সহজেই <span className="text-purple-300 font-bold">.json</span> বা <span className="text-purple-300 font-bold">.jsonl</span> ফাইল আপলোড করুন। ফাইলটি স্বয়ংক্রিয়ভাবে পার্স হয়ে <span className="text-emerald-300 font-mono font-semibold">ai_knowledge_base</span> টেবিলে সিঙ্ক হবে এবং <span className="text-indigo-300 font-semibold">pgvector</span> এম্বেডিং তৈরি করে চ্যাটবটের জন্য প্রস্তুত থাকবে।
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
            <div className="text-center px-3 border-r border-white/10">
              <span className="text-xs text-slate-400 block font-medium">মোট নলেজ এন্ট্রি</span>
              <span className="text-xl font-black text-emerald-400">
                {kbStatus?.totalEntries || 0}
              </span>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <span className="text-xs text-slate-400 block font-medium">ভেক্টর ডাইমেনশন</span>
              <span className="text-xl font-black text-purple-300">
                {kbStatus?.vectorDimensions || 768}d
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-xs text-slate-400 block font-medium">ডাটাবেজ টেবিল</span>
              <span className="text-xs font-mono font-bold text-teal-300 block">
                ai_knowledge_base
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/10 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>ফাইল আপলোড ও সিঙ্ক</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'test'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>RAG ভেক্টর টেস্ট</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'explorer'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>বর্তমান জ্ঞানভাণ্ডার ({kbStatus?.totalEntries || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Supabase / pgvector SQL</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTICE: Prominently displayed upon successful upload */}
      {feedbackNotice && (
        <div
          id="ai-sync-feedback-notice"
          className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-5 sm:p-6 shadow-md transition-all duration-300 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              <CheckCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verification Success</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-emerald-950">
                {feedbackNotice}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1 font-medium">
                ফাইলটি সঠিকভাবে প্রসেস করা হয়েছে। ভেক্টর এম্বেডিং তৈরি সম্পন্ন হয়েছে এবং ডেটাবেজে সংরক্ষিত হয়েছে।
              </p>

              {lastSyncResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-emerald-200 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-slate-500 block font-medium">পার্সকৃত প্রশ্ন-উত্তর</span>
                    <span className="text-base font-black text-emerald-700">
                      {lastSyncResult.count} টি
                    </span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-slate-500 block font-medium">আপডেট / প্রতিস্থাপিত</span>
                    <span className="text-base font-black text-teal-700">
                      {lastSyncResult.updatedCount || 0} টি
                    </span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-slate-500 block font-medium">নতুন সংযোজিত</span>
                    <span className="text-base font-black text-indigo-700">
                      {lastSyncResult.insertedCount || lastSyncResult.count} টি
                    </span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-slate-500 block font-medium">মোট সক্রিয় ভেক্টর</span>
                    <span className="text-base font-black text-purple-700">
                      {lastSyncResult.total} টি
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ERROR NOTICE */}
      {fileError && (
        <div
          id="ai-sync-error-notice"
          className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3 text-red-800 text-xs font-semibold"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm text-red-900 mb-0.5">আপলোড ও ভ্যালিডেশন ত্রুটি</p>
            <p>{fileError}</p>
          </div>
        </div>
      )}

      {/* TAB 1: UPLOAD & SYNC */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Upload Column */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-600" />
                <span>নলেজ বেস ফাইল আপলোড ফিল্ড</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                শুধুমাত্র <span className="font-mono text-purple-700 font-bold">.json</span> অথবা <span className="font-mono text-purple-700 font-bold">.jsonl</span> ফাইল সাপোর্ট করবে। সিস্টেমে <span className="font-mono text-slate-700 font-semibold">prompt_user</span> ও <span className="font-mono text-slate-700 font-semibold">completion_assistant</span> ফরম্যাটকে সর্বোচ্চ প্রাধান্য দেওয়া হয়।
              </p>
            </div>

            {/* Drag & Drop / File Input Field */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelection(e.dataTransfer.files[0]);
                }
              }}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-purple-600 bg-purple-50/50 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-purple-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="ai-knowledge-base-file-input"
                accept=".json,.jsonl"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition ${
                    selectedFile
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {selectedFile ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900 flex items-center justify-center gap-2">
                      <span>{selectedFile.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </p>
                    <p className="text-xs text-emerald-700 font-medium">
                      {parsedPreviewCount !== null
                        ? `✅ মোট ${parsedPreviewCount} টি প্রশ্ন-উত্তর ডাটা শনাক্ত হয়েছে`
                        : 'ফাইল রিড করা হয়েছে'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      ফাইল নির্বাচন করতে এখানে ক্লিক করুন অথবা টেনে এনে ছেড়ে দিন
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      গ্রহণযোগ্য ফরম্যাট: শুধুমাত্র <span className="font-mono font-bold text-purple-700">.json</span> এবং <span className="font-mono font-bold text-purple-700">.jsonl</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sync Mode Options */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>সিঙ্ক মোড নির্বাচন (Sync Strategy):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    syncMode === 'update'
                      ? 'bg-white border-purple-500 shadow-xs'
                      : 'bg-white/50 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="syncMode"
                    value="update"
                    checked={syncMode === 'update'}
                    onChange={() => setSyncMode('update')}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      স্মার্ট আপডেট ও সিঙ্ক (Merge & Update)
                    </span>
                    <span className="text-slate-500 text-[11px] leading-relaxed">
                      বিদ্যমান মিল থাকা প্রশ্নগুলোর উত্তর প্রতিস্থাপিত (Re-index) হবে এবং নতুন প্রশ্নগুলো সংযোজিত হবে।
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    syncMode === 'replace'
                      ? 'bg-white border-amber-500 shadow-xs'
                      : 'bg-white/50 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="syncMode"
                    value="replace"
                    checked={syncMode === 'replace'}
                    onChange={() => setSyncMode('replace')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      সম্পূর্ণ প্রতিস্থাপন (Full Replace & Re-index)
                    </span>
                    <span className="text-slate-500 text-[11px] leading-relaxed">
                      পুরনো সব ভেক্টর মুছে ফেলে সম্পূর্ণ নতুন ফাইল ডেটা দিয়ে পুনঃইনডেক্স তৈরি করবে।
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* ACTION BUTTON (Required exact label) */}
            <div className="pt-2">
              <button
                id="btn-upload-sync-ai-database"
                type="button"
                onClick={handleUploadAndSync}
                disabled={isUploading || !selectedFile}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                  isUploading || !selectedFile
                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:opacity-95 shadow-purple-600/30'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ভেক্টর তৈরি ও সিঙ্ক হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Upload & Sync to AI Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Guidelines and Schema info Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Format Example Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>প্রস্তাবিত JSON / JSONL ফরম্যাট</span>
              </h4>

              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <p className="text-emerald-400 font-bold mb-1.5">// JSONL উদাহরণ (প্রতি লাইনে ১টি অবজেক্ট):</p>
                <p className="text-slate-300">
                  {`{"prompt_user": "আম্রপালি আমের দাম কত?", "completion_assistant": "ঝাদিমাদি পাহাড়ি বাগানের প্রিমিয়াম আম্রপালি আম প্রতি কেজি ৳১২০।"}`}
                </p>
                <p className="text-slate-300 mt-2">
                  {`{"prompt_user": "কুরিয়ার ডেলিভারি চার্জ কত?", "completion_assistant": "সংশ্লিষ্ট কুরিয়ার সার্ভিসের অফিসিয়াল রেট প্রযোজ্য।"}`}
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>prompt_user:</strong> গ্রাহকের সম্ভাব্য প্রশ্ন বা অনুসন্ধান
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>completion_assistant:</strong> এআই-এর সঠিক, নির্ভরযোগ্য উত্তর (Zero Hallucination)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>category:</strong> বিষয়ভিত্তিক ক্যাটাগরি (যেমন: hillfood, delivery, services)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Export / Download Card & Upload JSON File */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>বর্তমান জ্ঞানভাণ্ডার ডাউনলোড (Download Knowledge Base)</span>
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                বিদ্যমান ডেটা ব্যাকআপ বা এডিটের জন্য ডাউনলোড করুন:
              </p>
              
              {/* Existing Download JSON & JSONL Options */}
              <div className="flex items-center gap-2">
                <a
                  id="admin-download-json-file-btn"
                  href="/api/admin/ai/knowledge-base/export?format=json"
                  download="jhadimadi_ai_knowledge_base.json"
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-700 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                  title="Download AI Knowledge Base as JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON File</span>
                </a>
                <a
                  id="admin-download-jsonl-file-btn"
                  href="/api/admin/ai/knowledge-base/export?format=jsonl"
                  download="jhadimadi_ai_knowledge_base.jsonl"
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-700 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                  title="Download AI Knowledge Base as JSONL"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSONL File</span>
                </a>
              </div>

              {/* NEW REQUIREMENT: "Upload JSON File" directly below "Download JSON File" option */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>Upload JSON File (ডাটাবেস ও AI সিঙ্ক)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Table: ai_knowledge_base
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  যেকোনো প্রশ্ন-উত্তর বা পণ্যের .json ফাইল আপলোড করুন। স্বয়ংক্রিয়ভাবে Supabase ডাটাবেসে আপডেট হবে এবং AI সহকারী তাৎক্ষণিকভাবে গ্রাহকদের সহায়তায় তা ব্যবহার করবে।
                </p>

                {/* Hidden File Input strictly accepting .json */}
                <input
                  type="file"
                  id="direct-json-file-input"
                  ref={directJsonInputRef}
                  accept=".json,application/json"
                  onChange={handleDirectJsonUpload}
                  className="hidden"
                />

                {/* Upload JSON File Button with Loading Indicator */}
                <button
                  type="button"
                  id="admin-upload-json-file-btn"
                  onClick={() => directJsonInputRef.current?.click()}
                  disabled={directUploadLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs font-bold text-center transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {directUploadLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>প্রসেসিং ও Supabase-এ সিঙ্ক হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-purple-200" />
                      <span>Upload JSON File</span>
                    </>
                  )}
                </button>

                {/* Clear UI Feedback / Toast Notifications directly in the card */}
                {directUploadToast && (
                  <div
                    id="direct-upload-toast-notification"
                    className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-2 border ${
                      directUploadToast.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {directUploadToast.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-[11px] mb-0.5">
                        {directUploadToast.type === 'success' ? 'সফল হয়েছে (Success)' : 'ত্রুটি (Upload Error)'}
                      </p>
                      <p className="leading-normal">{directUploadToast.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RAG VECTOR SEARCH SIMULATOR (STEP 1-3 TESTING) */}
      {activeTab === 'test' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <span>RAG ভেক্টর সিমুলেটর (Step 1-3 লাইভ টেস্ট)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                গ্রাহক যখন কোনো প্রশ্ন করবে, সিস্টেম কীভাবে <span className="font-mono text-purple-700 font-semibold">ai_knowledge_base</span> থেকে ১-৩টি প্রাসঙ্গিক তথ্য সিস্টেম প্রম্পটে সরবরাহ করে তা যাচাই করুন।
              </p>
            </div>
          </div>

          {/* Search Query Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunVectorSearch()}
                placeholder="একটি টেস্ট প্রশ্ন লিখুন (যেমন: পাহাড়ি আম্রপালি আম কিভাবে পাঠাবেন? বা রাজমিস্ত্রির রেট কত?)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
              />
            </div>
            <button
              type="button"
              onClick={handleRunVectorSearch}
              disabled={isSearching || !testQuery.trim()}
              className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer disabled:bg-slate-300"
            >
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>ভেক্টর মিল অনুসন্ধান</span>
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-500 text-[11px]">উদাহরণ টেস্ট:</span>
            {[
              'আম্রপালি আম কিভাবে পাঠাবেন?',
              'ডেলিভারি চার্জের নিয়ম কি?',
              'স্থায়ী সদস্য কিভাবে হতে পারি?',
              'জরুরি রক্তদাতা পাবো কিভাবে?',
              'রাজমিস্ত্রি কাজের রেট কত?',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTestQuery(preset);
                  setTimeout(() => handleRunVectorSearch(), 50);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-[11px] font-semibold transition cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Search Results Display */}
          {hasSearched && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>মিল পাওয়া ভেক্টর তথ্য ({testResults.length} টি)</span>
                <span className="text-indigo-600 text-[11px] normal-case font-bold">
                  সিস্টেম প্রম্পট ইনজেকশন ভিউ
                </span>
              </h4>

              {testResults.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
                  এই প্রশ্নের জন্য কোনো ভেক্টর মিল পাওয়া যায়নি। নতুন প্রশ্ন-উত্তর আপলোড করে সিঙ্ক করুন।
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {testResults.map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black uppercase">
                          ম্যাচ #{i + 1} — সাদৃশ্য স্কোর: {item.similarityScore}%
                        </span>
                        {item.category && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">
                          <span className="text-slate-500">প্রশ্ন (prompt_user): </span>
                          {item.prompt_user || item.userQuery}
                        </p>
                        <div className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-indigo-100 whitespace-pre-wrap leading-relaxed font-medium">
                          <span className="text-slate-500 block text-[11px] font-bold mb-1">
                            উৎস উত্তর (completion_assistant):
                          </span>
                          {item.completion_assistant || item.assistantResponse}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE EXPLORER */}
      {activeTab === 'explorer' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                <span>ai_knowledge_base সক্রিয় ডেটা তালিকা</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                বর্তমানে এআই মডেলের নলেজ বেসে মোট <span className="font-bold text-purple-700">{kbStatus?.totalEntries || 0}</span> টি প্রশ্নোত্তর সংরক্ষিত আছে।
              </p>
            </div>
            <button
              type="button"
              onClick={fetchStatus}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ করুন</span>
            </button>
          </div>

          {kbStatus?.sampleEntries && kbStatus.sampleEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="py-3 px-4 rounded-l-xl">আইডি</th>
                    <th className="py-3 px-4">প্রশ্ন (prompt_user)</th>
                    <th className="py-3 px-4">উত্তর (completion_assistant)</th>
                    <th className="py-3 px-4">ক্যাটাগরি</th>
                    <th className="py-3 px-4 rounded-r-xl">আপডেট টাইম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {kbStatus.sampleEntries.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {row.id ? row.id.slice(0, 10) + '...' : `kb_${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                        {row.prompt_user}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                        {row.completion_assistant}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                          {row.category || 'general'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[10px]">
                        {row.updated_at ? new Date(row.updated_at).toLocaleDateString('bn-BD') : 'সম্প্রতি'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
              বর্তমানে কোনো এন্ট্রি লোড হয়নি। দয়া করে উপরে .json অথবা .jsonl ফাইল আপলোড করুন।
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUPABASE / PGVECTOR SQL SCHEMA */}
      {activeTab === 'schema' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <span>Supabase / PostgreSQL ডাটাবেজ আর্কিটেকচার স্ক্রিপ্ট</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Supabase ড্যাশবোর্ডের <span className="font-bold text-indigo-700">SQL Editor</span>-এ নিচের স্ক্রিপ্টটি রান করলে <span className="font-mono text-purple-700 font-bold">ai_knowledge_base</span> টেবিল ও <span className="font-mono text-teal-700 font-bold">pgvector</span> এম্বেডিং ইনডেক্স স্বয়ংক্রিয়ভাবে প্রস্তুত হয়ে যাবে।
              </p>
            </div>
            <button
              type="button"
              onClick={copySqlToClipboard}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                sqlCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {sqlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{sqlCopied ? 'কপিকৃত হয়েছে!' : 'SQL কোড কপি করুন'}</span>
            </button>
          </div>

          <div className="bg-slate-950 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner max-h-96">
            <pre className="text-indigo-300">{supabaseSqlCode}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
