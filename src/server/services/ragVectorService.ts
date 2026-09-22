import fs from 'fs';
import path from 'path';

export interface RagSnippet {
  id: string;
  userQuery: string;
  assistantResponse: string;
  prompt_user?: string;
  completion_assistant?: string;
  category?: string;
  tags?: string[];
  embedding?: number[];
  source?: string;
  updatedAt: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  prompt_user: string;
  completion_assistant: string;
  category: string;
  tags?: string[];
  embedding?: number[];
  updated_at: string;
}

export interface RagSearchResult {
  item: RagSnippet;
  similarity: number;
  score: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const RAG_VECTORS_FILE = path.join(DATA_DIR, 'rag_knowledge_vectors.json');
const AI_KNOWLEDGE_BASE_FILE = path.join(DATA_DIR, 'ai_knowledge_base.json');

// ----------------------------------------------------
// SQL MIGRATION DEFINITION FOR SUPABASE / POSTGRESQL
// ----------------------------------------------------
export const SUPABASE_AI_KNOWLEDGE_BASE_SQL = `-- ==========================================================
-- JHADIMADI AI KNOWLEDGE BASE (SUPABASE / POSTGRESQL + PGVECTOR)
-- ==========================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create ai_knowledge_base table
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id TEXT PRIMARY KEY,
  prompt_user TEXT NOT NULL,
  completion_assistant TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  embedding VECTOR(256),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for fast vector cosine similarity search
CREATE INDEX IF NOT EXISTS ai_knowledge_base_embedding_idx 
ON ai_knowledge_base USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Public Read Access for ai_knowledge_base"
ON ai_knowledge_base FOR SELECT
USING (true);

CREATE POLICY "Admin All Access for ai_knowledge_base"
ON ai_knowledge_base FOR ALL
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
`;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ----------------------------------------------------
// 1. HIGH-PRECISION TEXT EMBEDDING & VECTOR MATH
// ----------------------------------------------------

/**
 * Computes cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic semantic n-gram + character hashing embedding vector (256-dim).
 * Used when Gemini API is offline or as an instant low-latency embedding layer.
 * Works seamlessly across Bangla, Banglish, English, and phonetic variants.
 */
export function computeSemanticHashVector(text: string, dimensions = 256): number[] {
  const vec = new Array(dimensions).fill(0);
  if (!text) return vec;

  const normalized = normalizeBanglaAndBanglish(text.toLowerCase());
  const words = normalized.split(/[\s,./?!+=_-]+/).filter(Boolean);

  // 1. Word hashing
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1.5;

    // 2. Character 3-grams for phonetic & spelling error tolerance
    for (let i = 0; i <= word.length - 3; i++) {
      const trigram = word.substring(i, i + 3);
      let triHash = 0;
      for (let j = 0; j < trigram.length; j++) {
        triHash = ((triHash << 5) - triHash) + trigram.charCodeAt(j);
        triHash |= 0;
      }
      const triIdx = Math.abs(triHash) % dimensions;
      vec[triIdx] += 0.5;
    }
  }

  // Normalize vector to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

/**
 * Generates an embedding for text.
 * Prefers Gemini text-embedding-004 if available, otherwise falls back to deterministic semantic vector.
 */
export async function generateTextEmbedding(
  text: string,
  geminiClient?: any
): Promise<number[]> {
  if (!text) return new Array(256).fill(0);

  if (geminiClient) {
    try {
      const response = await geminiClient.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      });
      if (response?.embedding?.values && Array.isArray(response.embedding.values)) {
        return response.embedding.values;
      }
    } catch (e: any) {
      // Fallback silently to fast semantic hash vector
      // console.warn('[RAG] Gemini embed fallback:', e?.message);
    }
  }

  return computeSemanticHashVector(text, 256);
}

// ----------------------------------------------------
// 2. BANGLA, BANGLISH & PHONETIC NORMALIZATION
// ----------------------------------------------------

import { normalizeBengaliUnicode, normalizeBengaliDiacritics } from './bengaliSearchEngine';

/**
 * Normalizes Bangla character variations, voice transcription phonetic misinterpretations,
 * and Banglish transliterations using generalized Unicode & diacritic normalization.
 */
export function normalizeBanglaAndBanglish(input: string): string {
  if (!input) return '';
  // 1. Generalized Unicode NFC & Zero-Width normalization
  let str = normalizeBengaliUnicode(input);

  // 2. Canonicalize platform branding
  str = str.replace(/ঝাদিমাদি|ঝাদি-মাদি|জাদিমাদি|জাদি-মাদি|হাদিমাদি|হাদি-মাদি|ঝাদিমাদি|জাদিমাদী|হাদিমাদী|জাদি\s*মাদি|হাদি\s*মাদি|ঝাদি\s*মাদি|jadimadi|hadimadi|jhadimadi|zhadimadi/gi, 'ঝাদিমাদি');

  // 3. Apply generalized Bengali diacritic equivalence (sibilants, vowels, liquids, nasals)
  str = normalizeBengaliDiacritics(str);

  // 4. Common platform category tokens
  str = str.replace(/রক্তদাতা|রক্ত দাতা|ব্লাড ডোনার|ব্লাড ডোনেশন/g, 'রক্তদাতা');
  str = str.replace(/খাগড়াছড়ি|খাগড়াছড়ী|খাগড়াছড়ি|খাগড়াছরি/g, 'খাগড়াছড়ি');
  str = str.replace(/রাঙ্গামাটি|রাঙামাটি|রাঙ্গামাটি সদর/g, 'রাঙ্গামাটি');
  str = str.replace(/বান্দরবান|বান্দরবন/g, 'বান্দরবান');

  str = str.replace(/ache|ase|available|stock/g, 'স্টক');
  str = str.replace(/blood|donor|rokto|roktodata/g, 'রক্তদাতা');

  return str;
}

// ----------------------------------------------------
// 3. JSON & JSONL PARSING (MESSAGES / QA PAIRS)
// ----------------------------------------------------

export interface ParsedQAPair {
  id?: string;
  userQuery: string;
  assistantResponse: string;
  category?: string;
  tags?: string[];
  source?: string;
}

/**
 * Parses raw JSON or JSONL content into normalized User & Assistant Q&A pairs.
 * Supports OpenAI/Gemini fine-tuning message formats, QA objects, prompts, and custom structured JSON.
 */
export function parseJsonOrJsonl(fileContent: string): ParsedQAPair[] {
  const results: ParsedQAPair[] = [];
  if (!fileContent || !fileContent.trim()) return results;

  const trimmed = fileContent.trim();

  // Try parsing as JSONL (Line-delimited JSON)
  if (trimmed.includes('\n') && !trimmed.startsWith('[')) {
    const lines = trimmed.split('\n');
    let isJsonl = false;

    for (const line of lines) {
      const lineTrim = line.trim();
      if (!lineTrim) continue;
      try {
        const obj = JSON.parse(lineTrim);
        const pairs = extractQAPairsFromObject(obj);
        if (pairs.length > 0) {
          results.push(...pairs);
          isJsonl = true;
        }
      } catch {
        // Not a JSONL line, fallback to whole-file JSON parsing below
      }
    }

    if (isJsonl && results.length > 0) {
      return results;
    }
  }

  // Parse as regular JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        results.push(...extractQAPairsFromObject(item));
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Check if it wraps an array (e.g. { data: [...] }, { messages: [...] }, { faqs: [...] })
      if (Array.isArray(parsed.messages)) {
        results.push(...extractQAPairsFromMessages(parsed.messages));
      } else if (Array.isArray(parsed.faqs)) {
        for (const item of parsed.faqs) {
          results.push(...extractQAPairsFromObject(item));
        }
      } else if (Array.isArray(parsed.qaPairs) || Array.isArray(parsed.data) || Array.isArray(parsed.items)) {
        const arr = parsed.qaPairs || parsed.data || parsed.items;
        for (const item of arr) {
          results.push(...extractQAPairsFromObject(item));
        }
      } else {
        results.push(...extractQAPairsFromObject(parsed));
      }
    }
  } catch (e: any) {
    console.error('[RAG Parser] Failed to parse JSON:', e.message);
  }

  return results;
}

/**
 * Extracts Q&A pairs from fine-tuning messages array:
 * [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
 */
function extractQAPairsFromMessages(messages: any[]): ParsedQAPair[] {
  const pairs: ParsedQAPair[] = [];
  if (!Array.isArray(messages)) return pairs;

  let currentUserQuery = '';

  for (const m of messages) {
    if (!m) continue;
    const role = (m.role || '').toLowerCase();
    const content = typeof m.content === 'string' ? m.content : (m.text || '');

    if (role === 'user' || role === 'human') {
      currentUserQuery = content.trim();
    } else if ((role === 'assistant' || role === 'model' || role === 'bot') && currentUserQuery) {
      pairs.push({
        userQuery: currentUserQuery,
        assistantResponse: content.trim(),
        category: m.category || 'General',
        tags: m.tags || [],
      });
      currentUserQuery = '';
    }
  }

  return pairs;
}

/**
 * Extracts Q&A from various object schemas, explicitly supporting prompt_user & completion_assistant
 */
function extractQAPairsFromObject(obj: any): ParsedQAPair[] {
  if (!obj || typeof obj !== 'object') return [];

  // Check for messages field
  if (Array.isArray(obj.messages)) {
    return extractQAPairsFromMessages(obj.messages);
  }

  // Schema variations: Prioritize prompt_user & completion_assistant
  const userQuery =
    obj.prompt_user ||
    obj.prompt ||
    obj.userQuery ||
    obj.user ||
    obj.question ||
    obj.q ||
    obj.input ||
    obj.query ||
    obj.customerQuery ||
    '';

  const assistantResponse =
    obj.completion_assistant ||
    obj.completion ||
    obj.assistantResponse ||
    obj.assistant ||
    obj.answer ||
    obj.a ||
    obj.response ||
    obj.output ||
    obj.reply ||
    obj.botReply ||
    '';

  if (userQuery && assistantResponse) {
    return [
      {
        id: obj.id ? String(obj.id) : undefined,
        userQuery: String(userQuery).trim(),
        assistantResponse: String(assistantResponse).trim(),
        category: obj.category || obj.topic || 'General',
        tags: Array.isArray(obj.tags) ? obj.tags : [],
      },
    ];
  }

  // If structured info block (e.g. company info or policy)
  if (obj.title && obj.content) {
    return [
      {
        id: obj.id ? String(obj.id) : undefined,
        userQuery: `${obj.title} সম্পর্কে তথ্য কী?`,
        assistantResponse: String(obj.content).trim(),
        category: obj.category || 'Knowledge',
        tags: obj.tags || [],
      },
    ];
  }

  return [];
}

// ----------------------------------------------------
// 4. PRE-SEEDED OFFICIAL JHADIMADI KNOWLEDGE BASE
// ----------------------------------------------------

export const INITIAL_JHADIMADI_QA_SNIPPETS: ParsedQAPair[] = [
  {
    userQuery: 'ঝাদিমাদি সিদোল কী এবং এর দাম কত? (Sidol price and details)',
    assistantResponse: `🌿 **ঝাদিমাদি খাঁটি পাহাড়ি সিদোল (Jhadimadi Sidol):**
• **পণ্যের নাম:** ঝাদিমাদি সিদোল (Jhadimadi Sidol)
• **পণ্যের কোড:** 001
• **বর্তমান মূল্য:** ৳১৫০ (অরিজিনাল রেগুলার মূল্য: ৳১৯০)
• **পরিমাণ / ওজন:** ৫০০ গ্রাম
• **স্টক স্ট্যাটাস:** স্টকে রয়েছে (Available In Stock)
• **মান ও উৎস:** ১০০% খাঁটি, ঘরে তৈরি ও পাহাড়ি ট্র্যাডিশনাল নিয়মে প্রস্তুত
• **ডেলিভারি নিয়ম:** ক্যাশ অন ডেলিভারি (Cash on Delivery) সারাদেশে উপলব্ধ। ডেলিভারি চার্জ নির্ধারিত হবে সংশ্লিষ্ট কুরিয়ারের বর্তমান চার্জ অনুযায়ী।`,
    category: 'Products',
    tags: ['sidol', 'সিদোল', 'শুটকি', 'দাম', 'food'],
  },
  {
    userQuery: 'কাপ্তাই লেকের চিংড়ি শুটকি পাওয়া যাবে কি? দাম কত?',
    assistantResponse: `🦐 **কাপ্তাই লেকের চিংড়ি শুটকি (Kaptai Lake Dry Shrimp):**
• **পণ্যের নাম:** কাপ্তাই লেকের চিংড়ি শুটাক
• **পণ্যের কোড:** 002
• **বর্তমান অফার মূল্য:** ৳১৫০ (পূর্ব মূল্য: ৳১৯০)
• **পরিমাণ:** ৫০০ গ্রাম
• **স্টক:** স্টকে পর্যাপ্ত রয়েছে
• **উৎস:** কাপ্তাই লেক থেকে সংগৃহীত শতভাগ অর্গানিক ও ফ্রেশ
• **ডেলিভারি:** সারাদেশে ২-৩ কার্যদিবসের মধ্যে হোম ডেলিভারি। ডেলিভারি চার্জ সংশ্লিষ্ট কুরিয়ারের চার্জ অনুযায়ী নির্ধারিত হবে।`,
    category: 'Products',
    tags: ['chingri', 'চিংড়ি', 'শুটকি', 'কাপ্তai', 'food'],
  },
  {
    userQuery: 'কাপ্তাই লেকের শুড়ি শুটকি দাম এবং ওজন কত?',
    assistantResponse: `🐟 **কাপ্তাই লেকের শুড়ি শুটকি:**
• **পণ্যের নাম:** কাপ্তাই লেকের শুড়ি শুটকি
• **পণ্যের কোড:** 003
• **দাম:** ৳১৫০ (অরিজিনাল: ৳১৯০)
• **পরিমাণ / সাইজ:** ৫০০ গ্রাম
• **স্টক অবস্থা:** স্টকে রয়েছে
• **মান:** ১০০% প্রিজারভেটিভমুক্ত অর্গানিক পাহাড়ি শুটকি
• **ডেলিভারি চার্জ:** ডেলিভারি চার্জ নির্ধারিত হবে সংশ্লিষ্ট কুরিয়ারের বর্তমান চার্জ অনুযায়ী।`,
    category: 'Products',
    tags: ['shuri', 'শুড়ি', 'শুটকি', 'কাপ্তাই'],
  },
  {
    userQuery: 'ঝাদিমাদি খাঁটি সরিষার তেল আছে? দাম কত?',
    assistantResponse: `🌻 **ঝাদিমাদি খাঁটি সরিষার তেল (Pure Mustard Oil):**
• **পণ্যের নাম:** ঝাদিমাদি সরিষার তেল
• **পণ্যের কোড:** 004
• **মূল্য:** ৳১৫০ (অরিজিনাল মূল্য: ৳১৯০)
• **পরিমাণ:** ৫০০ গ্রাম
• **গুণমান:** ১০০% খাঁটি ও ঝাঁঝালো সরিষার তেল
• **ডেলিভারি:** Cash on Delivery উপলব্ধ। পণ্যের দাম ৳১৫০। ডেলিভারি চার্জ গন্তব্য ও কুরিয়ারের বর্তমান চার্জ অনুযায়ী নির্ধারিত হবে।`,
    category: 'Products',
    tags: ['mustard', 'সরিষার তেল', 'oil', 'খাবার'],
  },
  {
    userQuery: 'চাকমা ঐতিহ্যবাহী পিনন-হাদি পাওয়া যাবে? দাম কত?',
    assistantResponse: `👗 **আদিবাসী পাহাড়ি পিনন-হাদি (Pinon-Hadi):**
• **পণ্যের নাম:** চাকমা ঐতিহ্যবাহী পিনন-হাদি
• **মূল্য:** ৳৩,৫০০ (পূর্বের মূল্য: ৳৪,০০০)
• **পরিমাণ:** ১টি সম্পূর্ণ সেট
• **উৎস:** রাঙ্গামাটি ঐতিহ্যবাহী তাঁতের তৈরি
• **স্টক:** সীমিত স্টক উপলব্ধ (১২ পিস স্টকে রয়েছে)
• **ডেলিভারি:** সারাদেশে কুরিয়ার হোম ডেলিভারি। ডেলিভারি চার্জ কুরিয়ারের বর্তমান রেট অনুযায়ী প্রযোজ্য হবে।`,
    category: 'Products',
    tags: ['pinon', 'hadi', 'পিনন-হাদি', 'পোশাক', 'আদিবাসী'],
  },
  {
    userQuery: 'ঝাদিমাদি কী? এর প্রতিষ্ঠাতা কে এবং কবে প্রতিষ্ঠিত হয়েছে?',
    assistantResponse: `🌿 **Jhadimadi.com (ঝাদিমাদি ডটকম) পরিচিতি:**
• **প্রতিষ্ঠান:** ঝাদিমাদি ডটকম — পার্বত্য চট্টগ্রাম ও সারাদেশের অন-ডিমান্ড হোম সার্ভিসেস, চাকরির সার্কুলার, জরুরি রক্তদাতা এবং শতভাগ খাঁটি অর্গানিক কৃষিজ পণ্যের সুপার-অ্যাপ।
• **প্রতিষ্ঠাতা:** নয়ন চাকমা (Nayan Chakma)
• **প্রতিষ্ঠাকাল:** জানুয়ারি ২০২২ (January 2022)
• **প্রধান কার্যালয়:** খাগড়াছড়ি সদর, পার্বত্য চট্টগ্রাম (Khagrachhari Sadar, CHT, Bangladesh)
• **স্লোগান:** “আপনার প্রয়োজনের কথা বলুন, Jhadimadi আপনার জন্য খুঁজে দেবে।”`,
    category: 'Company',
    tags: ['company', 'founder', 'নয়ন চাকমা', 'প্রতিষ্ঠাতা', 'office'],
  },
  {
    userQuery: 'ঝাদিমাদির অফিসিয়াল কন্টাক্ট নম্বর ও হেল্পলাইন কী?',
    assistantResponse: `📞 **ঝাদিমাদি অফিসিয়াল যোগাযোগ ও হেল্পলাইন:**
• **হটলাইন ও WhatsApp:** 01870592699
• **অফিসিয়াল ইমেইল:** jhadimadi2024@gmail.com
• **ওয়েবসাইট:** https://jhadimadi.com
• **হেডকোয়ার্টার ঠিকানা:** খাগড়াছড়ি সদর, খাগড়াছড়ি পার্বত্য জেলা, বাংলাদেশ
• **সাপোর্ট সময়সূচি:** সকাল ৮:০০ টা থেকে রাত ১০:০০ টা (জরুরি সেবা ২৪/৭)`,
    category: 'Company',
    tags: ['contact', 'hotline', 'phone', 'whatsapp', 'যোগাযোগ', 'help'],
  },
  {
    userQuery: 'ডেলিভারি চার্জ কত এবং ডেলিভারি পেতে কতদিন সময় লাগে?',
    assistantResponse: `🚚 **ডেলিভারি ও কুরিয়ার সংক্রান্ত তথ্য:**
• **ডেলিভারি সময়:** সারাদেশে সাধারণত ২ থেকে ৩ কার্যদিবসের মধ্যে নির্ভরযোগ্য কুরিয়ারের মাধ্যমে ক্যাশ অন ডেলিভারিতে পণ্য পৌঁছে দেওয়া হয়।
• **ডেলিভারি চার্জ নীতি:** ডেলিভারি চার্জ নির্ধারিত হবে সংশ্লিষ্ট কুরিয়ারের বর্তমান চার্জ অনুযায়ী। চার্জ গন্তব্য (পার্বত্য জেলা নাকি সমতল), ওজন ও কুরিয়ার সার্ভিসের ওপর নির্ভর করে।
• **মোট খরচ নীতি:** পণ্যের দাম ৳XXX। ডেলিভারি চার্জ গন্তব্য ও কুরিয়ারের বর্তমান চার্জ অনুযায়ী নির্ধারিত হবে।
• **অফিসিয়াল পার্টনার কুরিয়ার:** সুন্দরবন কুরিয়ার, পাঠাও, স্টেডফাস্ট, রেডএক্স, এস এ পরিবহন এবং লোকাল নিজস্ব রাইডার।`,
    category: 'Delivery',
    tags: ['delivery', 'charge', 'courier', 'ডেলিভারি', 'খরচ'],
  },
  {
    userQuery: 'কীভাবে অর্ডার করব? (How to place an order)',
    assistantResponse: `🛒 **অর্ডার করার সহজ পদ্ধতি:**
• **১. পণ্য নির্বাচন করুন:** আপনার পছন্দের পণ্য ও পরিমাণ জানান।
• **২. প্রয়োজনীয় তথ্য দিন:**
   - আপনার পূর্ণ নাম
   - সচল মোবাইল নম্বর
   - সঠিক ডেলিভারি ঠিকানা (জেলা, উপজেলা, রোড/গ্রাম)
• **৩. কনফার্মেশন:** আপনি চ্যাটে তথ্য দিলে আমরা সাথে সাথে অর্ডারটি কনফার্ম করে ক্যাশ অন ডেলিভারিতে পার্সেল পাঠিয়ে দেব।`,
    category: 'Order',
    tags: ['order', 'অর্ডার', 'ক্যাশ অন ডেলিভারি', 'buy'],
  },
  {
    userQuery: 'জরুরি রক্তদাতা ও হেল্পলাইন কীভাবে পাব? (Blood Donors & Helplines)',
    assistantResponse: `🩸 **জরুরি রক্তদাতা ও জাতীয় হেল্পলাইন সেবা:**
• **রক্তদাতা নেটওয়ার্ক:** A+, A-, B+, B-, O+, O-, AB+, AB- ভেরিফাইড রক্তদাতাদের সাথে ঝাদিমাদির মাধ্যমে তাৎক্ষণিক যোগাযোগ করা সম্ভব।
• **গোপনীয়তা রক্ষা:** কোনো রক্তদাতার ব্যক্তিগত গোপনীয় তথ্য বা অপ্রয়োজনীয় তথ্য জনসমক্ষে প্রকাশ করা হয় না।
• **জরুরি হেল্পলাইন নম্বর:**
   - 🚨 জাতীয় জরুরি সেবা: 999 (পুলিশ, অ্যাম্বুলেন্স, ফায়ার সার্ভিস)
   - 🩺 স্বাস্থ্য বাতায়ন: 16263 (২৪/৭ ফ্রি ডাক্তার পরামর্শ)
   - 👩‍👧 নারী ও শিশু সহায়তা: 109
   - 👶 চাইল্ড হেল্পলাইন: 1098
   - 🏛️ সরকারি তথ্য সেবা: 333`,
    category: 'Blood',
    tags: ['blood', 'রক্ত', 'রক্তদাতা', 'helpline', 'emergency', '999'],
  },
  {
    userQuery: 'ইলেকট্রিশিয়ান, প্লাম্বার বা রাজমিস্ত্রি কীভাবে বুক করব?',
    assistantResponse: `🛠️ **ঝাদিমাদি অন-ডিমান্ড হোম সার্ভিস ও মিস্ত্রি বুকিং:**
• **উপলব্ধ সেবা:**
   - ⚡ অভিজ্ঞ ইলেকট্রিশিয়ান (বাসা ওয়্যারিং, সুইচ ও ফ্যান মেরামত)
   - 🚰 প্লাম্বার ও পানির পাইপ মিস্ত্রি
   - 🧱 দক্ষ রাজমিস্ত্রি ও নির্মাণ শ্রমিক
   - 🪚 কাঠমিস্ত্রি ও রংমিস্ত্রি
   - 🧹 বাসা ক্লিনিং ও হোম শিফটিং
• **বুকিং পদ্ধতি:** চ্যাটে আপনার প্রয়োজনীয় কাজের বিবরণ ও এলাকা জানান অথবা অ্যাপের 'সার্ভিসেস' মেন্যু থেকে সরাসরি যাচাইকৃত কারিগর নির্বাচন করুন।`,
    category: 'Services',
    tags: ['service', 'electrician', 'plumber', 'mason', 'মিস্ত্রি'],
  },
  {
    userQuery: 'স্থায়ী সদস্য হিসেবে কীভাবে যোগ দেওয়া যায়?',
    assistantResponse: `🤝 **ঝাদিমাদি স্থায়ী সদস্য (Permanent Member) ব্যবস্থা:**
• **সংজ্ঞা:** স্থায়ী সদস্য হলেন জেলা ও উপজেলাভিত্তিক মাঠপর্যায়ের বিশ্বস্ত প্রতিনিধি।
• **প্রধান দায়িত্ব:** স্থানীয় নাগরিক ও উদ্যোক্তাদের ঝাদিমাদিতে যুক্ত করা, কৃষকদের খাঁটি পণ্য তালিকায় সহায়তা করা এবং স্থানীয় কার্যক্রম সমন্বয় করা।
• **আবেদন নিয়ম:** অ্যাপের 'রেজিস্ট্রেশন' অপশন থেকে 'স্থায়ী সদস্য হিসেবে যোগ দিন' নির্বাচন করে আপনার ভোটার এনআইডি দিয়ে আবেদন করুন।
• **সতর্কবার্তা:** এটি কোনো সরকারি বা ফিক্সড বেতনভুক্ত চাকরি নয়; অনুমোদিত পারফরম্যান্স ও সাংগঠনিক কার্যক্রম অনুযায়ী সম্মানী নির্ধারিত হয়।`,
    category: 'Membership',
    tags: ['permanent', 'member', 'স্থায়ী সদস্য', 'registration'],
  },
  {
    userQuery: 'পণ্য পছন্দ না হলে বা নষ্ট থাকলে রিটার্ন বা রিফান্ড কীভাবে পাব?',
    assistantResponse: `🔄 **ঝাদিমাদি রিটার্ন ও রিফান্ড পলিসি:**
• পণ্য গ্রহণের সময় কোনো ত্রুটি, ভুল পণ্য বা প্যাকেজিংয়ে ক্ষতি দেখলে ডেলিভারি ম্যানের সামনেই আনবক্সিং প্রমাণসহ ৪৮ ঘণ্টার মধ্যে আমাদের হটলাইনে (01870592699) যোগাযোগ করুন।
• যথাযথ যাচাই সাপেক্ষে সম্পূর্ণ নতুন পণ্য প্রতিস্থাপন অথবা ১০০% অর্থ দ্রুত ফেরত দেওয়া হয়।`,
    category: 'Policies',
    tags: ['return', 'refund', 'policy', 'রিফান্ড', 'ফেরত'],
  },
];

// ----------------------------------------------------
// 5. VECTOR STORE & PERSISTENCE MANAGER
// ----------------------------------------------------

class RagVectorStore {
  private snippets: RagSnippet[] = [];
  private isInitialized = false;

  constructor() {
    this.loadFromDisk();
  }

  /**
   * Loads saved vector snippets from disk. If empty, auto-initializes with official Jhadimadi QA data.
   */
  public async loadFromDisk() {
    try {
      if (fs.existsSync(RAG_VECTORS_FILE)) {
        const raw = fs.readFileSync(RAG_VECTORS_FILE, 'utf-8');
        this.snippets = JSON.parse(raw);
        this.isInitialized = true;
        console.log(`[RAG Vector Store] Loaded ${this.snippets.length} vectors from ${RAG_VECTORS_FILE}`);
        return;
      }
    } catch (e: any) {
      console.warn('[RAG Vector Store] Failed reading cache:', e.message);
    }

    // Auto-seed with default Jhadimadi knowledge
    await this.seedInitialKnowledge();
  }

  /**
   * Seeds initial official knowledge snippets and pre-computes their embeddings.
   */
  public async seedInitialKnowledge(geminiClient?: any) {
    console.log('[RAG Vector Store] Seeding initial official Jhadimadi knowledge vectors...');
    const seeded: RagSnippet[] = [];

    for (let i = 0; i < INITIAL_JHADIMADI_QA_SNIPPETS.length; i++) {
      const item = INITIAL_JHADIMADI_QA_SNIPPETS[i];
      const combinedText = `${item.userQuery}\n${item.assistantResponse}\n${item.tags?.join(' ') || ''}`;
      const embedding = await generateTextEmbedding(combinedText, geminiClient);

      seeded.push({
        id: `rag_seed_${i + 1}`,
        userQuery: item.userQuery,
        assistantResponse: item.assistantResponse,
        category: item.category,
        tags: item.tags,
        embedding,
        source: 'jhadimadi_official_seed',
        updatedAt: new Date().toISOString(),
      });
    }

    this.snippets = seeded;
    this.isInitialized = true;
    this.saveToDisk();
  }

  /**
   * Saves current vector snippets to disk in both rag_knowledge_vectors.json and ai_knowledge_base.json
   */
  public saveToDisk() {
    try {
      fs.writeFileSync(RAG_VECTORS_FILE, JSON.stringify(this.snippets, null, 2), 'utf-8');
      
      // Also format and save to ai_knowledge_base.json matching Supabase schema
      const kbEntries = this.getAllKnowledgeBaseEntries();
      fs.writeFileSync(AI_KNOWLEDGE_BASE_FILE, JSON.stringify(kbEntries, null, 2), 'utf-8');
    } catch (e: any) {
      console.error('[RAG Vector Store] Failed writing vectors to disk:', e.message);
    }
  }

  /**
   * Returns all knowledge base entries formatted according to the ai_knowledge_base table schema
   */
  public getAllKnowledgeBaseEntries(): KnowledgeBaseEntry[] {
    return this.snippets.map(s => ({
      id: s.id,
      prompt_user: s.prompt_user || s.userQuery,
      completion_assistant: s.completion_assistant || s.assistantResponse,
      category: s.category || 'general',
      tags: s.tags || [],
      embedding: s.embedding,
      updated_at: s.updatedAt,
    }));
  }

  /**
   * Synchronizes knowledge base entries from uploaded JSON / JSONL.
   * Auto-checks existing data: updates matching records, inserts new records, or replaces all if mode === 'replace'.
   * Generates Vector Embeddings for pgvector and fast similarity search.
   */
  public async syncKnowledgeBase(
    fileContent: string,
    options: {
      mode?: 'update' | 'replace';
      sourceName?: string;
      geminiClient?: any;
    } = {}
  ): Promise<{
    count: number;
    updatedCount: number;
    insertedCount: number;
    total: number;
    categories: string[];
    samples: RagSnippet[];
    allSnippets: RagSnippet[];
  }> {
    const { mode = 'update', sourceName = 'ai_config_upload', geminiClient } = options;

    const parsedPairs = parseJsonOrJsonl(fileContent);
    if (parsedPairs.length === 0) {
      throw new Error('ফাইলের মধ্যে কোনো বৈধ প্রশ্ন ও উত্তর (prompt_user & completion_assistant) পাওয়া যায়নি। .json বা .jsonl ফাইল চেক করুন।');
    }

    let updatedCount = 0;
    let insertedCount = 0;

    if (mode === 'replace') {
      const newSnippets: RagSnippet[] = [];
      for (let i = 0; i < parsedPairs.length; i++) {
        const p = parsedPairs[i];
        const combinedText = `${p.userQuery}\n${p.assistantResponse}\n${p.tags?.join(' ') || ''}`;
        const embedding = await generateTextEmbedding(combinedText, geminiClient);
        const snippetId = p.id || `kb_${Date.now()}_${i + 1}`;

        newSnippets.push({
          id: snippetId,
          userQuery: p.userQuery,
          assistantResponse: p.assistantResponse,
          prompt_user: p.userQuery,
          completion_assistant: p.assistantResponse,
          category: p.category || 'General',
          tags: p.tags || [],
          embedding,
          source: sourceName,
          updatedAt: new Date().toISOString(),
        });
        insertedCount++;
      }
      this.snippets = newSnippets;
    } else {
      // Auto-check: Update existing matching entries or insert new ones
      for (let i = 0; i < parsedPairs.length; i++) {
        const p = parsedPairs[i];
        const combinedText = `${p.userQuery}\n${p.assistantResponse}\n${p.tags?.join(' ') || ''}`;
        const embedding = await generateTextEmbedding(combinedText, geminiClient);
        const normalizedQ = normalizeBanglaAndBanglish(p.userQuery);

        const existingIndex = this.snippets.findIndex(
          s => (p.id && s.id === p.id) || normalizeBanglaAndBanglish(s.userQuery) === normalizedQ
        );

        if (existingIndex >= 0) {
          // Update / Replace matching entry
          this.snippets[existingIndex] = {
            ...this.snippets[existingIndex],
            id: p.id || this.snippets[existingIndex].id,
            userQuery: p.userQuery,
            assistantResponse: p.assistantResponse,
            prompt_user: p.userQuery,
            completion_assistant: p.assistantResponse,
            category: p.category || this.snippets[existingIndex].category || 'General',
            tags: p.tags && p.tags.length > 0 ? p.tags : this.snippets[existingIndex].tags,
            embedding,
            source: sourceName,
            updatedAt: new Date().toISOString(),
          };
          updatedCount++;
        } else {
          // Insert new
          const snippetId = p.id || `kb_${Date.now()}_${i + 1}`;
          this.snippets.push({
            id: snippetId,
            userQuery: p.userQuery,
            assistantResponse: p.assistantResponse,
            prompt_user: p.userQuery,
            completion_assistant: p.assistantResponse,
            category: p.category || 'General',
            tags: p.tags || [],
            embedding,
            source: sourceName,
            updatedAt: new Date().toISOString(),
          });
          insertedCount++;
        }
      }
    }

    this.saveToDisk();

    const categorySet = new Set<string>();
    this.snippets.forEach(s => {
      if (s.category) categorySet.add(s.category);
    });

    return {
      count: parsedPairs.length,
      updatedCount,
      insertedCount,
      total: this.snippets.length,
      categories: Array.from(categorySet),
      samples: this.snippets.slice(-5),
      allSnippets: this.snippets,
    };
  }

  /**
   * Re-indexes or replaces vectors from uploaded JSON / JSONL content.
   * "তথ্য আপডেট হলে পুরনো ভেক্টর ডেটা প্রতিস্থাপিত (Re-index) হতে হবে।"
   */
  public async reindexFromJson(
    fileContent: string,
    options: { mode?: 'replace' | 'append'; sourceName?: string; geminiClient?: any } = {}
  ): Promise<{ count: number; total: number; samples: RagSnippet[] }> {
    const syncRes = await this.syncKnowledgeBase(fileContent, {
      mode: options.mode === 'replace' ? 'replace' : 'update',
      sourceName: options.sourceName,
      geminiClient: options.geminiClient,
    });

    return {
      count: syncRes.count,
      total: syncRes.total,
      samples: syncRes.samples,
    };
  }

  /**
   * Performs Vector Similarity Search and returns the top 1-3 most relevant JSON snippets.
   * Uses hybrid scoring (Cosine similarity + Bangla phonetic/keyword overlap).
   */
  public async searchSimilarity(
    query: string,
    topK = 3,
    geminiClient?: any
  ): Promise<RagSearchResult[]> {
    if (!query || this.snippets.length === 0) return [];

    const normalizedQuery = normalizeBanglaAndBanglish(query);
    const queryEmbedding = await generateTextEmbedding(query, geminiClient);
    const queryTokens = normalizedQuery.split(/[\s,./?!+=_-]+/).filter(t => t.length >= 2);

    const scoredResults: RagSearchResult[] = [];

    for (const snippet of this.snippets) {
      // 1. Vector Cosine Similarity
      let vectorSim = 0;
      if (snippet.embedding && snippet.embedding.length > 0) {
        vectorSim = cosineSimilarity(queryEmbedding, snippet.embedding);
      }

      // 2. Lexical & Phonetic keyword matching
      const targetText = normalizeBanglaAndBanglish(
        `${snippet.userQuery} ${snippet.tags?.join(' ') || ''} ${snippet.category || ''} ${snippet.assistantResponse}`
      );

      let tokenHits = 0;
      for (const token of queryTokens) {
        if (targetText.includes(token)) {
          tokenHits++;
        }
      }

      const lexicalScore = queryTokens.length > 0 ? (tokenHits / queryTokens.length) : 0;

      // 3. Combined Hybrid Score
      const finalScore = (vectorSim * 0.65) + (lexicalScore * 0.35);

      scoredResults.push({
        item: snippet,
        similarity: finalScore,
        score: finalScore,
      });
    }

    // Sort descending by similarity
    scoredResults.sort((a, b) => b.similarity - a.similarity);

    // Filter to top K (top 1-3 items)
    return scoredResults.slice(0, Math.min(topK, scoredResults.length));
  }

  public getAll(): RagSnippet[] {
    return this.snippets;
  }

  public getAllItems(): RagSnippet[] {
    return this.snippets;
  }

  public getCount(): number {
    return this.snippets.length;
  }

  public getStats() {
    const categories = Array.from(new Set(this.snippets.map(s => s.category || 'General')));
    const sampleDim = this.snippets.find(s => s.embedding && s.embedding.length > 0)?.embedding?.length || 768;
    const latestUpdate = this.snippets.reduce((latest, s) => {
      const d = s.updatedAt || '';
      return d > latest ? d : latest;
    }, '');

    return {
      totalVectors: this.snippets.length,
      dimensions: sampleDim,
      activeCategories: categories,
      indexedAt: latestUpdate || new Date().toISOString(),
      status: 'ready',
    };
  }
}

// Global Singleton Instance
export const ragVectorStore = new RagVectorStore();
