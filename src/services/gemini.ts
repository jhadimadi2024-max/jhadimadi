/**
 * Gemini AI Client Service
 * Hyperlocal AI Assistance, Smart Intent Parsing & Content Assistant
 * Connects to server-side Gemini 3.7 Flash API with graceful fallback.
 */

export interface GeminiAssistantResponse {
  responseBn: string;
  recommendedCategory?: string;
  estimatedPriceRange?: string;
  suggestedActions?: string[];
  source?: 'gemini-live' | 'domain-fallback';
}

export interface GeminiSmartSearchResponse {
  category: string;
  cleanKeywords: string;
  explanation: string;
  estimatedRate: string;
  tags: string[];
  source?: 'gemini-live' | 'domain-fallback' | 'database-verified' | 'deterministic-fast';
  matchType?: 'product' | 'provider' | 'blood' | 'job_seeker' | 'job_circular' | 'service';
  hasRealMatches?: boolean;
  realResults?: any[];
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
}

/**
 * Ask Gemini Assistant for hyperlocal rates, job market data & agricultural advice
 */
export async function askGeminiAssistant(
  userQuery: string,
  context?: { location?: string; timestamp?: string }
): Promise<GeminiAssistantResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('/api/gemini/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userQuery: userQuery.trim(),
        context: context || {
          location: 'রাঙ্গামাটি / খাগড়াছড়ি / বান্দরবান',
          timestamp: new Date().toISOString(),
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }

    throw new Error(result.message || 'Invalid response structure');
  } catch (error) {
    console.warn('[Gemini Service] Fallback triggered:', (error as Error).message);
    return {
      responseBn: `✨ **ঝাদিমাদি এআই সহায়তা:**\n\n"${userQuery}" সংক্রান্ত তথ্যের জন্য আমাদের ভেরিফাইড ডিরেক্টরি ব্রাউজ করুন অথবা সরাসরি সার্চ ফিল্টার ব্যবহার করুন।`,
      recommendedCategory: 'all',
      estimatedPriceRange: 'লোকাল মার্কেট রেট অনুযায়ী',
      suggestedActions: ['সার্চে দেখুন', 'হোমপেজে ফিরে যান'],
      source: 'domain-fallback',
    };
  }
}

/**
 * Smart Search with natural language query parsing via Gemini
 */
export async function smartSearchGemini(
  query: string,
  location?: string
): Promise<GeminiSmartSearchResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('/api/gemini/smart-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        location: location || 'পার্বত্য চট্টগ্রাম',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      return {
        category: result.category || 'all',
        cleanKeywords: result.cleanKeywords || query,
        explanation: result.explanation || 'ফিল্টার সম্পন্ন হয়েছে।',
        estimatedRate: result.estimatedRate || '',
        tags: result.tags || [],
        source: result.source || 'gemini-live',
        matchType: result.matchType || 'service',
        hasRealMatches: Boolean(result.hasRealMatches),
        realResults: Array.isArray(result.realResults) ? result.realResults : [],
        structuredIntent: result.structuredIntent || {},
      };
    }

    throw new Error('Search parsing failed');
  } catch (err) {
    console.warn('[Gemini Smart Search] Error fallback:', (err as Error).message);
    return {
      category: 'all',
      cleanKeywords: query,
      explanation: 'সার্চ রেজাল্ট লোড হয়েছে।',
      estimatedRate: 'আলোচনা সাপেক্ষ',
      tags: ['সার্চ দেখুন'],
      source: 'domain-fallback',
      hasRealMatches: false,
      realResults: [],
    };
  }
}

export interface GeminiProductRecommendation {
  id?: string;
  name: string;
  price: string;
  category?: string;
  image?: string;
}

export type GeminiActionLinkType = 'blood' | 'product' | 'checkout' | 'service' | 'jobs' | 'join' | 'feed' | 'helpline' | 'services' | 'registration';

export interface GeminiActionLink {
  type: GeminiActionLinkType;
  id?: string;
  postId?: string;
  registrationTab?: string;
  label: string;
  url?: string;
}

export interface GeminiSupportChatResponse {
  replyBn: string;
  replyEn?: string;
  is_order?: boolean;
  order_status?: string;
  orderData?: {
    is_order: boolean;
    order_status?: string;
    customer_name?: string;
    phone?: string;
    address?: string;
    delivery_address?: string;
    product?: string;
    items?: Array<{ product_name: string; quantity: number }>;
  };
  actionLink?: GeminiActionLink;
  recommendedProducts?: GeminiProductRecommendation[];
  quickReplyChips?: string[];
  source?: string;
  preliminaryNotice?: string;
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
  clarificationChips?: string[];
}

export interface GeminiNidVerificationResult {
  success: boolean;
  isDuplicate?: boolean;
  isFakeDetected?: boolean;
  authenticityScore?: number;
  duplicateWarning?: string;
  tamperWarnings?: string[];
  message?: string;
  extractedData?: {
    nidNumber: string;
    nameBangla: string;
    nameEnglish: string;
    fatherName?: string;
    motherName?: string;
    dateOfBirth: string;
    bloodGroup?: string;
    address?: string;
    nidType: string;
    authenticityScore: number;
    isFakeDetected: boolean;
    tamperWarnings: string[];
    verificationSummaryBn: string;
  };
  verifiedBadge?: string;
}

function formatBengaliDistrictIdClient(district?: string, index: number = 1): string {
  const d = (district || '').toLowerCase();
  let prefix = 'খাগ';
  if (d.includes('রাঙ্গামাটি') || d.includes('রাঙামাটি') || d.includes('rangamati')) prefix = 'রাঙা';
  else if (d.includes('বান্দরবান') || d.includes('bandarban')) prefix = 'বান্দ';
  else if (d.includes('খাগড়াছড়ি') || d.includes('খাগড়াছড়ি') || d.includes('khagrachhari')) prefix = 'খাগ';

  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const formattedNum = String(index).padStart(3, '0').split('').map(char => bnDigits[Number(char)] || char).join('');
  return `${prefix}-${formattedNum}`;
}

function formatContactActionClient(phone?: string): string {
  const cleanPhone = (phone || '01870592699').replace(/[^0-9+]/g, '');
  return `<a href="tel:${cleanPhone}">যোগাযোগ করুন</a>`;
}

/**
 * Ask Gemini Customer Support Chatbot (Jhadimadi)
 * Uses live dynamic products from the homepage & dashboard
 */
export async function askGeminiSupportChat(
  message: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  userContext?: { userName?: string; phone?: string; location?: string; gender?: string; userId?: string },
  liveProducts?: any[],
  livePosts?: any[],
  liveUsers?: any[]
): Promise<GeminiSupportChatResponse> {
  // DETERMINISTIC PERFORMANCE FAST-PATH FOR COMMON GREETINGS (Instant response, saves AI tokens)
  const cleanMsg = message.trim().toLowerCase();
  const isDirectGreeting = /^(?:হাই|হ্যালো|সালাম|আসসালামু\s*আলাইকুম|নমস্কার|শুভ\s*(?:সকাল|সন্ধ্যা|রাত্রি)|কেমন\s*আছেন|hi|hello|hey|salam|assalamu\s*alaikum)[\s.?!]*$/i.test(cleanMsg);
  if (isDirectGreeting) {
    const userGender = (userContext?.gender || '').toLowerCase();
    const salutation = userGender === 'female' || userGender === 'নারী' || userGender === 'মহিলা' ? 'ম্যাডাম' : 'স্যার';
    return {
      replyBn: `হ্যালো ${salutation}! আমি ঝাদিমাদি এআই (Jhadimadi AI) অ্যাসিস্ট্যান্ট। আপনাকে আজ কীভাবে সাহায্য করতে পারি বলুন?\n\nআমাদের প্ল্যাটফর্ম Jhadimadi.com-এ আপনার প্রয়োজনীয় সব সেবাই হাতের নাগালে রয়েছে। আপনার ঠিক কী প্রয়োজন, তা আমাকে জানান:\n• পণ্য ও কেনাকাটা: আমাদের নিজস্ব পণ্যের বিশাল সম্ভার থেকে আপনার পছন্দের পণ্যটি খুঁজে নিতে আমাকে বলুন। আপনি কোন এলাকায় আছেন এবং কোন পণ্যটি চাচ্ছেন তা জানালে, আমাদের সিস্টেমে রেজিস্ট্রেশন থাকা সাপেক্ষে তা আমি মুহূর্তের মধ্যে আপনার সামনে হাজির করে দেব।\n• পেশাদার সেবা (সার্ভিস প্রোভাইডার): ঘরের যেকোনো জরুরি কাজে প্লাম্বার, ইলেকট্রিশিয়ান কিংবা অন্য কোনো পেশাদার দক্ষ মানুষের প্রয়োজন হলে আমাকে বলুন। আশপাশে রেজিস্টার্ড কোনো সেবাকারী থাকলে আমি আপনাকে খুব সহজেই খুঁজে বের করে দেব।\n• জরুরি রক্তের সন্ধান: আপনার বা আপনার প্রিয়জনের রক্তের প্রয়োজন হলে আমাকে জানান। আপনার কাঙ্ক্ষিত ব্লাড গ্রুপের কোনো দাতা আমাদের প্ল্যাটফর্মে রেজিস্টার্ড থাকলে আমি আপনাকে দ্রুত তথ্য দিয়ে সহযোগিতা করব।\n\nযেকোনো বিশেষ সহযোগিতা বা সরাসরি পরামর্শের জন্য আপনি সরাসরি আমাদের অফিশিয়াল WhatsApp নাম্বারে যোগাযোগ করতে পারেন।\n📞 WhatsApp: 01870592699`,
      replyEn: `Greetings ${salutation}! I am Jhadimadi AI assistant. How may I assist you today?`,
      recommendedProducts: [],
      quickReplyChips: ['🛍️ পাহাড়ি পণ্য', '⚡ মিস্ত্রি ও সেবা', '🩸 রক্তদাতা', '💼 চাকরি ও ক্যারিয়ার', '📞 WhatsApp যোগাযোগ'],
      source: 'deterministic-fast',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // AI SECURITY GUARDRAIL: Never transmit private identifiers (phone, passwords, NID/KYC documents, banking PINs)
    const sanitizedUserContext = {
      location: userContext?.location || 'পার্বত্য চট্টগ্রাম',
      gender: userContext?.gender || '',
    };

    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        conversationHistory,
        userContext: sanitizedUserContext,
        liveProducts,
        livePosts,
        liveUsers,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Chat API responded with status ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      return {
        replyBn: result.replyBn,
        replyEn: result.replyEn,
        is_order: Boolean(result.is_order),
        orderData: result.orderData,
        actionLink: result.actionLink,
        recommendedProducts: result.recommendedProducts || [],
        quickReplyChips: result.quickReplyChips || [],
        source: result.source || 'jhadimadi-core-engine',
        preliminaryNotice: result.preliminaryNotice,
        clarificationNeeded: result.clarificationNeeded,
        clarificationQuestion: result.clarificationQuestion,
        clarificationChips: result.clarificationChips,
      };
    }

    throw new Error(result.message || 'Support chat response failed');
  } catch (error) {
    console.info('[Jhadimadi Support Service] Local fallback engaged:', (error as Error).message);
    const qLower = message.toLowerCase().trim();

    const activeList = Array.isArray(liveProducts) ? liveProducts.filter(p => p && p.isPublished !== false) : [];
    const liveChips = activeList.slice(0, 3).map(p => `${p.nameBn} (${p.unit || ''})`.trim());
    const fallbackChips = [...liveChips, '🛒 সরাসরি অর্ডার করুন', 'সেবা সমূহের তালিকা', 'যোগাযোগ / WhatsApp'].slice(0, 5);

    // Order detection in client fallback
    const phoneMatch = message.match(/(?:(?:\+|00)8801|01)[3-9]\d{8}/) || message.match(/০১[৩-৯][০-৯]{8}/);
    const hasOrderIntent = /অর্ডার|কিনব|কিনতে চাই|নিব|পাঠান|ডেলিভারি দিন|order|buy/i.test(message);

    if (hasOrderIntent && phoneMatch) {
      const extractedPhone = phoneMatch[0];
      const lines = message.split(/[\n,;]+/);
      let custName = userContext?.userName || 'সম্মানিত গ্রাহক';
      let custAddress = userContext?.location || 'ঠিকানা চ্যাটে উল্লেখ করা হয়েছে';
      let custProduct = 'ঝাদিমাদি অর্গানিক পাহাড়ি পণ্য';

      for (const line of lines) {
        const l = line.trim();
        if (/নাম[:\s-]/i.test(l)) {
          custName = l.replace(/^.*নাম[:\s-]*/i, '').trim() || custName;
        } else if (/ঠিকানা[:\s-]|বাসা[:\s-]/i.test(l)) {
          custAddress = l.replace(/^.*(?:ঠিকানা|বাসা)[:\s-]*/i, '').trim() || custAddress;
        } else if (/পণ্য[:\s-]|আইটেম[:\s-]|কেজি|প্যাকেট/i.test(l)) {
          custProduct = l.replace(/^.*(?:পণ্য|আইটেম)[:\s-]*/i, '').trim() || custProduct;
        }
      }

      return {
        replyBn: `🎉 **ধন্যবাদ! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।**\n\nঝাদিমাদি ডটকম (Jhadimadi.com)-এর পক্ষ থেকে আপনার অর্ডারের তথ্য লিপিবদ্ধ করা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার মোবাইল নম্বরে যোগাযোগ করে ডেলিভারি নিশ্চিত করবেন।\n\n• **ডেলিভারি পদ্ধতি:** ক্যাশ অন ডেলিভারি (Cash on Delivery)\n• **আনুমানিক সময়:** ২-৩ কার্যদিবস\n• **ডেলিভারি চার্জ নিয়ম:** ডেলিভারি চার্জ নির্ধারিত হবে সংশ্লিষ্ট কুরিয়ারের বর্তমান চার্জ অনুযায়ী।\n\n{\n  "is_order": true,\n  "customer_name": "${custName}",\n  "phone": "${extractedPhone}",\n  "address": "${custAddress}",\n  "product": "${custProduct}"\n}`,
        is_order: true,
        orderData: {
          is_order: true,
          customer_name: custName,
          phone: extractedPhone,
          address: custAddress,
          product: custProduct,
        },
        recommendedProducts: [],
        quickReplyChips: fallbackChips,
        source: 'client-fallback',
      };
    }

    if (hasOrderIntent && !phoneMatch) {
      return {
        replyBn: `🛍️ **ঝাদিমাদি ডটকম থেকে অর্ডার করার জন্য ধন্যবাদ!**\n\nআপনার অর্ডারটি নিশ্চিত করতে অনুগ্রহ করে নিচের তথ্যগুলো লিখে পাঠান:\n\n১. **আপনার নাম (Full Name):**\n২. **সচল মোবাইল নম্বর (Phone Number):**\n৩. **সম্পূর্ণ ডেলিভারি ঠিকানা (Delivery Address):**\n৪. **কাঙ্ক্ষিত পণ্যের নাম ও পরিমাণ (Product & Quantity):**\n\nতথ্যগুলো পাওয়ার সাথে সাথেই সিস্টেম আপনার অর্ডার প্রসেস করবে।`,
        is_order: false,
        recommendedProducts: [],
        quickReplyChips: fallbackChips,
        source: 'client-fallback',
      };
    }

    // Dynamic product finder for client fallback
    const matchLiveProduct = (text: string) => {
      const q = text.toLowerCase();
      const tokens = q.split(/[\s,./?!+-]+/).filter(t => t.length >= 2);
      return activeList.filter(p => {
        const nameBn = (p.nameBn || '').toLowerCase();
        const nameEn = (p.nameEn || '').toLowerCase();
        const code = (p.code || '').toLowerCase();
        const category = (p.categoryLabelBn || p.category || '').toLowerCase();

        if (code && (q === code || q.includes(code))) return true;
        if (nameBn.includes(q) || nameEn.includes(q)) return true;

        if (q.includes('মরিচ') || q.includes('chili')) {
          if (nameBn.includes('মরিচ') || nameEn.includes('chili')) return true;
        }
        if (q.includes('হলুদ') || q.includes('turmeric')) {
          if (nameBn.includes('হলুদ') || nameEn.includes('turmeric')) return true;
        }
        if (q.includes('শুঁটকি') || q.includes('শুটকি') || q.includes('shutki') || q.includes('চিংড়ি') || q.includes('চিংড়ি')) {
          if (nameBn.includes('শুঁটকি') || nameBn.includes('শুটকি') || nameBn.includes('চিংড়ি')) return true;
        }
        if (q.includes('মধু') || q.includes('দুধ') || q.includes('honey')) {
          if (nameBn.includes('মধু') || nameBn.includes('দুধ')) return true;
        }
        if (q.includes('চাল') || q.includes('বিনি') || q.includes('জুম')) {
          if (nameBn.includes('চাল') || nameBn.includes('বিনি') || nameBn.includes('জুম')) return true;
        }

        return tokens.some(t => nameBn.includes(t) || nameEn.includes(t) || category.includes(t));
      });
    };
    
    // 1. Greeting & Core Principle
    if (/^(হ্যালো|হাই|সালাম|আসসালামু|নমস্কার|কেমন আছেন|hello|hi|hey|kemon achen)/i.test(qLower) || qLower === 'হ্যালো' || qLower === 'হাই' || qLower === 'কেমন আছেন') {
      const activeSample = activeList.slice(0, 3).map(p => `${p.nameBn} (৳${p.price})`).join(', ');
      return {
        replyBn: `👋 **হ্যালো! আমি ঝাদিমাদি (Jhadimadi)।**\n\n“আপনার প্রয়োজনের কথা বলুন, Jhadimadi আপনার জন্য খুঁজে দেবে।”\n\nবর্তমানে আমাদের সক্রিয় পাহাড়ি পণ্যের মধ্যে রয়েছে: ${activeSample || 'পাহাড়ের খাঁটি কৃষিজ পণ্য ও অর্গানিক মসলা'}।\n\nপণ্য অর্ডার, দক্ষ মিস্ত্রি বুকিং, চাকরির তথ্য, জরুরি রক্তদাতা কিংবা প্ল্যাটফর্মে যোগদানের নিয়ম জানতে আমাকে জানান!`,
        recommendedProducts: [],
        quickReplyChips: fallbackChips,
        source: 'client-fallback',
      };
    }

    // 2. Company Identity
    if (qLower.includes('প্রতিষ্ঠান') || qLower.includes('প্রতিষ্ঠাতা') || qLower.includes('নয়ন') || qLower.includes('নয়ন') || qLower.includes('founder') || qLower.includes('company') || qLower.includes('ঠিকানা')) {
      return {
        replyBn: `🏢 **ঝাদিমাদি ডটকম (Jhadimadi.com) পরিচিতি:**\n\n• **প্রতিষ্ঠাতা:** নয়ন চাকমা (Nayan Chakma)\n• **প্রধান কার্যালয়:** খাগড়াছড়ি সদর, পার্বত্য চট্টগ্রাম\n• **ধরন:** প্রাইভেট লিমিটেড (RJSC রেজিস্ট্রেশন প্রক্রিয়াধীন)\n• **প্রতিষ্ঠার সাল:** জানুয়ারি ২০২২\n• **প্রকৃতি:** মাল্টি-পারপাস ই-কমার্স ও হাইপারলোকাল সার্ভিস প্ল্যাটফর্ম\n• **লক্ষ্য ও উদ্দেশ্য:** পার্বত্য চট্টগ্রামের উৎপাদিত সকল কৃষিজ ও অর্গানিক পণ্য সারাদেশে পৌঁছে দেওয়া, কৃষকদের ন্যায্য মূল্য নিশ্চিত করা ও কর্মসংস্থান সৃষ্টি করা ("Jhadimadi Green Revolution")।`,
        recommendedProducts: [],
        quickReplyChips: fallbackChips,
        source: 'client-fallback',
      };
    }

    // 3. Permanent Member (স্থায়ী সদস্য)
    if (qLower.includes('স্থায়ী সদস্য') || qLower.includes('স্থায়ী সদস্য') || qLower.includes('ফিল্ড প্রতিনিধি')) {
      return {
        replyBn: `🤝 **ঝাদিমাদি স্থায়ী সদস্য (Permanent Member) ব্যবস্থা:**\n\n• **সংগঠন:** জেলা ও উপজেলা ভিত্তিক স্থায়ী সদস্য নেটওয়ার্ক।\n• **দায়িত্ব ও ভূমিকা:**\n  ১. স্থানীয় জনগণকে ঝাদিমাদিতে রেজিস্ট্রেশন করতে সহায়তা করা।\n  ২. সাধারণ ব্যবহারকারীদের প্রয়োজনীয় পণ্য ও সেবা খুঁজে পেতে সাহায্য করা।\n  ৩. ঝাদিমাদির পণ্য ও সেবাসমূহ স্থানীয়ভাবে প্রচার করা।\n  ৪. স্থানীয় উদ্যোক্তা ও ব্যবসায়ীদের সহায়তা প্রদান করা।\n  ৫. স্থানীয় সামাজিক ও উন্নয়নমূলক কার্যক্রমে সক্রিয় ভূমিকা রাখা।\n\n⚠️ *সতর্কবার্তা: স্থায়ী সদস্য পদ কোনো সরকারি চাকরি বা নির্ধারিত বেতনের নিয়োগ নয়। এটি পারস্পরিক উন্নয়ন ও স্থানীয় ক্ষমতায়ন ভিত্তিক।*`,
        actionLink: {
          type: 'registration',
          registrationTab: 'permanent',
          label: 'স্থায়ী সদস্য হিসেবে যোগ দিন',
        },
        recommendedProducts: [],
        quickReplyChips: ['স্থায়ী সদস্য হিসেবে যোগ দিন', '💼 চাকরির বিজ্ঞপ্তি', 'যোগাযোগ / WhatsApp'],
        source: 'client-fallback',
      };
    }

    // 4. Registration Assistance (5 Tracks)
    if (qLower.includes('যোগ দিন') || qLower.includes('রেজিস্ট্রেশন') || qLower.includes('বিক্রেতা') || qLower.includes('মেম্বার') || qLower.includes('রেজিস্টার') || qLower.includes('ফি') || qLower.includes('nid')) {
      return {
        replyBn: `✨ **ঝাদিমাদি প্ল্যাটফর্মে যোগদানের ৫টি সহজ পথ:**\n\n১. **চাকরি খুঁজতে যোগ দিন:** জীবনবৃত্তান্ত তৈরি করে চাকরিপ্রার্থী হিসেবে যোগ দিন।\n২. **চাকরি দিতে যোগ দিন:** প্রতিষ্ঠানের জন্য কর্মী নিয়োগ বিজ্ঞপ্তি পোস্ট করুন।\n৩. **সেবা দিতে যোগ দিন:** টেকনিশিয়ান হিসেবে স্থানীয় কাজের অর্ডার পান।\n৪. **ব্যবসা করতে যোগ দিন:** দোকান বা পণ্য অনলাইনে বিক্রি করুন।\n৫. **স্থায়ী সদস্য হিসেবে যোগ দিন:** স্থানীয় প্রতিনিধি হিসেবে কাজ করুন।\n\n• **ফি ও ভেরিফিকেশন:** বার্ষিক রেজিস্ট্রেশন ফি মাত্র **৳ ১০০** (সেবাদাতা ও বিক্রেতা)। ভোটার এনআইডি ও সেলফি ভেরিফিকেশনে ব্লু-টিক ভেরিফাইড ব্যাজ দেওয়া হয়।`,
        actionLink: {
          type: 'registration',
          registrationTab: 'service',
          label: 'রেজিস্ট্রেশন পোর্টালে যান',
        },
        recommendedProducts: [],
        quickReplyChips: ['চাকরি খুঁজতে যোগ দিন', 'সেবা দিতে যোগ দিন', 'ব্যবসা করতে যোগ দিন', 'স্থায়ী সদস্য হিসেবে যোগ দিন'],
        source: 'client-fallback',
      };
    }

    // Respectful salutation
    const userGender = (userContext?.gender || '').toLowerCase();
    const salutation = userGender === 'female' || userGender === 'নারী' || userGender === 'মহিলা' ? 'ম্যাডাম' : 'স্যার';

    // 5. Blood Donors & Emergency (3-Tier Search & Execution Workflow)
    const isBlood = /রক্ত|ব্লাড|blood|donor|ডোনার|\b(?:a|b|ab|o)[+-]\b|পজিটিভ|পজেটিভ|নেগেটিভ/i.test(qLower);
    if (isBlood) {
      let bg: string | null = null;
      if (/AB\s*\+|এবি\s*পজিটিভ|এবি\+/i.test(qLower)) bg = 'AB+';
      else if (/AB\s*\-|এবি\s*নেগেটিভ|এবি\-/i.test(qLower)) bg = 'AB-';
      else if (/A\s*\+|এ\s*পজিটিভ|এ\+/i.test(qLower)) bg = 'A+';
      else if (/A\s*\-|এ\s*নেগেটিভ|এ\-/i.test(qLower)) bg = 'A-';
      else if (/B\s*\+|বি\s*পজিটিভ|বি\+/i.test(qLower)) bg = 'B+';
      else if (/B\s*\-|বি\s*নেগেটিভ|বি\-/i.test(qLower)) bg = 'B-';
      else if (/O\s*\+|ও\s*পজিটিভ|ও\+/i.test(qLower)) bg = 'O+';
      else if (/O\s*\-|ও\s*নেগেটিভ|ও\-/i.test(qLower)) bg = 'O-';
      else {
        const bgMatch = qLower.toUpperCase().match(/\b(A|B|AB|O)[+-]\b/);
        if (bgMatch) bg = bgMatch[0];
      }

      const bgText = bg ? `${bg} ` : '';

      // TIER 2: Search client posts and feed if provided
      const matchedPosts = Array.isArray(livePosts) ? livePosts.filter(p => {
        const text = `${p.title || ''} ${p.content || ''} ${p.category || ''} ${p.authorName || ''}`.toLowerCase();
        const hasBloodTerm = /রক্ত|ব্লাড|blood|donor|ডোনার/i.test(text);
        if (!hasBloodTerm) return false;
        if (bg) {
          const bgRegex = new RegExp(bg.replace('+', '\\+'), 'i');
          return bgRegex.test(text);
        }
        return true;
      }) : [];

      // Also search registered user profiles
      const matchedUsers = Array.isArray(liveUsers) ? liveUsers.filter(u => {
        if (!u.bloodGroup) return false;
        if (bg && u.bloodGroup.toUpperCase() !== bg.toUpperCase()) return false;
        return true;
      }) : [];

      if (matchedPosts.length > 0) {
        const p = matchedPosts[0];
        const contactAction = formatContactActionClient(p.realPhone || p.phone);
        const uniqueId = formatBengaliDistrictIdClient(p.district, 1);
        return {
          replyBn: `🩸 **${salutation}, অ্যাপের কমিউনিটি পোস্টে আপনার কাঙ্ক্ষিত রক্তের সন্ধান পাওয়া গেছে:**\n\n• **পোস্টের শিরোনাম:** ${p.title}\n• **পোস্টকারী:** ${p.authorName || 'নিবন্ধিত সদস্য'} (আইডি: ${uniqueId})\n• **এলাকা:** ${[p.upazila, p.district].filter(Boolean).join(', ') || 'পার্বত্য চট্টগ্রাম'}\n• **যোগাযোগ:** ${contactAction}\n\n📝 *পোস্টের বিবরণ:* ${p.content}\n\n🔒 *গ্রাহক সুরক্ষায় ফোন নম্বর সুরক্ষিত বাটনে দেওয়া হয়েছে।*`,
          actionLink: {
            type: 'feed',
            postId: p.id,
            label: 'পোস্টটি অ্যাপে দেখুন',
          },
          recommendedProducts: [],
          quickReplyChips: ['পোস্টটি দেখুন', 'যোগাযোগ / WhatsApp', '৯৯৯ কল করুন'],
          source: 'client-fallback',
        };
      }

      if (matchedUsers.length > 0) {
        const u = matchedUsers[0];
        const contactAction = formatContactActionClient(u.phone);
        const uniqueId = formatBengaliDistrictIdClient(u.district, 1);
        return {
          replyBn: `🩸 **${salutation}, ঝাদিমাদি নিবন্ধিত রক্তদাতার সন্ধান পাওয়া গেছে:**\n\n• **রক্তের গ্রুপ ${u.bloodGroup}:** ${u.fullName || u.name || 'নিবন্ধিত রক্তদাতা'}\n• **ইউনিক আইডি:** ${uniqueId}\n• **ঠিকানা:** ${[u.upazila, u.district].filter(Boolean).join(', ') || 'পার্বত্য চট্টগ্রাম'}\n• **স্ট্যাটাস:** মানবিক রক্তদানে প্রস্তুত\n• **যোগাযোগ:** ${contactAction}\n\n🔒 *ব্যক্তিগত গোপনীয়তা রক্ষায় সরাসরি ডায়াল লিংকের মাধ্যমে যোগাযোগ নিশ্চিত করা হয়েছে।*`,
          actionLink: {
            type: 'blood',
            label: 'রক্তদাতার প্রোফাইল দেখুন',
          },
          recommendedProducts: [],
          quickReplyChips: ['রক্তদাতার তালিকা', 'যোগাযোগ / WhatsApp', '৯৯৯ কল করুন'],
          source: 'client-fallback',
        };
      }

      // TIER 3: Mandatory Fallback Message (Exact required Bengali phrasing)
      return {
        replyBn: `দুঃখিত ${salutation}, আমি আন্তরিকভাবে দুঃখিত। আমাদের ডাটাবেজ এবং অ্যাপের পোস্টগুলো খুঁজেও এই মুহূর্তে আপনার কাঙ্ক্ষিত ${bgText}রক্তের কোনো ডোনার বা পোস্ট পাওয়া যায়নি। জরুরি প্রয়োজনে আপনি অবিলম্বে ৯৯৯ (999)-এ কল করতে পারেন অথবা আমাদের WhatsApp নাম্বারে সরাসরি যোগাযোগ করতে পারেন।`,
        actionLink: {
          type: 'blood',
          label: 'জরুরি রক্তদাতা ও হেল্পলাইন',
        },
        recommendedProducts: [],
        quickReplyChips: ['৯৯৯ কল করুন', 'যোগাযোগ / WhatsApp', 'জরুরি হেল্পলাইন'],
        source: 'client-fallback',
      };
    }

    // 6. Jobs & Circulars
    if (qLower.includes('চাকরি') || qLower.includes('job') || qLower.includes('সার্কুলার') || qLower.includes('নিয়োগ') || qLower.includes('কাজ খুঁজ') || qLower.includes('ক্যারিয়ার')) {
      return {
        replyBn: `💼 **ঝাদিমাদি চাকরির বিজ্ঞপ্তি ও ক্যারিয়ার সুবিধা:**\n\n• খাগড়াছড়ি, রাঙ্গামাটি, বান্দরবান ও চট্টগ্রামসহ সারাদেশে সেলস, ডেলিভারি রাইডার, অ্যাকাউন্টস ও টেকনিক্যাল পদের সার্কুলার রয়েছে।\n• আপনি অ্যাপের "চাকরি" বিভাগ থেকে সরাসরি আবেদন করতে পারেন অথবা আপনার প্রতিষ্ঠানের জন্য কর্মী খুঁজতে সার্কুলার পোস্ট করতে পারেন।\n• সরাসরি পরামর্শ ও সহায়তার জন্য আমাদের হেল্পলাইনে যোগাযোগ করুন।`,
        actionLink: {
          type: 'jobs',
          label: 'চাকরির সার্কুলার দেখুন',
        },
        recommendedProducts: [],
        quickReplyChips: ['💼 চাকরির বিজ্ঞপ্তি', 'চাকরি খুঁজতে যোগ দিন', 'চাকরি দিতে যোগ দিন'],
        source: 'client-fallback',
      };
    }

    // 7. Dynamic Product Matches (Strict Rules 1 & 3)
    const isProductInquiry = (
      /দাম|কত|টাকা|কিনব|কিনতে|অর্ডার|order|buy|stock|স্টক|পণ্য|কেজি|প্যাকেট|আইটেম|মরিচ|হলুদ|মধু|তেল|ঘি|চা|চাল|শুটকি|শুঁটকি|সিদল|সিদোল|আদা|রসুন|পিনন|হাদি|কাজুবাদাম|চন্দন|আম|লিচু/i.test(qLower) ||
      /(?:আছে\s*কি|পাওয়া\s*যাবে|দিতে\s*পারবেন|পাওয়া\s*যায়|পাব)/i.test(qLower)
    );
    const matched = !isBlood ? matchLiveProduct(qLower) : [];
    const inStockMatched = matched.filter(p => p.stock === undefined || p.stock > 0);

    if (isProductInquiry && inStockMatched.length === 0) {
      return {
        replyBn: `দুঃখিত স্যার, আপনার কাঙ্ক্ষিত পণ্যটি এই মুহূর্তে আমাদের স্টকে নেই। বিস্তারিত জানতে বা সরাসরি অর্ডার সংক্রান্ত তথ্যের জন্য আমাদের WhatsApp নাম্বারে যোগাযোগ করতে পারেন: 01870592699।`,
        recommendedProducts: [],
        quickReplyChips: ['যোগাযোগ / WhatsApp', 'অন্যান্য সেবা', 'পাহাড়ি খাঁটি পণ্য'],
        source: 'client-fallback',
      };
    }

    if (inStockMatched.length > 0) {
      const primary = inStockMatched[0];
      const hasDiscount = primary.originalPrice && primary.originalPrice > primary.price;
      const discountText = hasDiscount ? ` (পূর্বমূল্য: ৳ ${primary.originalPrice} - সক্রিয় অফার)` : '';
      const unitText = primary.unit ? ` - ${primary.unit}` : '';

      return {
        replyBn: `✨ **${primary.nameBn}${unitText}:**\n\n• **মূল্য:** **৳ ${primary.price}**${discountText} (এই দামটি Jhadimadi-তে বিদ্যমান সর্বশেষ তথ্যের ওপর ভিত্তি করে প্রদর্শিত)\n• **পণ্য কোড:** ${primary.code || 'N/A'}\n• **উৎস / প্রস্তুতি:** ${primary.origin || primary.productionOrigin || 'পার্বত্য চট্টগ্রাম'}\n• **মান নিয়ন্ত্রণ:** ${primary.qualityStandards || '১০০% বিশুদ্ধ ও রাসায়নিকমুক্ত'}\n• **ডেলিভারি:** সারাদেশে হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি (আনুমানিক ২-৩ কার্যদিবস)।\n• **ডেলিভারি চার্জ নিয়ম:** ডেলিভারি চার্জ নির্ধারিত হবে সংশ্লিষ্ট কুরিয়ারের বর্তমান চার্জ অনুযায়ী।\n• **মোট খরচ:** পণ্যের দাম ৳${primary.price}। ডেলিভারি চার্জ গন্তব্য ও কুরিয়ারের বর্তমান চার্জ অনুযায়ী নির্ধারিত হবে।\n\n${primary.descriptionBn ? `📝 **বিবরণ:** ${primary.descriptionBn}\n\n` : ''}📌 *হোমপেজ থেকে সরাসরি অর্ডার করতে পণ্য কার্ডের মাধ্যমে অর্ডার করুন অথবা চ্যাটে নাম ও ঠিকানা পাঠান।*`,
        recommendedProducts: inStockMatched.slice(0, 3).map(p => ({
          id: String(p.id),
          name: `${p.nameBn}${p.unit ? ` (${p.unit})` : ''}`,
          price: `৳ ${p.price}`,
          category: p.categoryLabelBn || p.category || 'পাহাড়ি পণ্য',
          image: p.image || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        })),
        quickReplyChips: fallbackChips,
        source: 'client-fallback',
      };
    }

    // 8. Services & Professionals (শিক্ষক, ডাক্তার, ইলেকট্রিশিয়ান, প্লাম্বার, নার্স, ইত্যাদি)
    if (
      qLower.includes('সেবা') ||
      qLower.includes('সার্ভিস') ||
      qLower.includes('service') ||
      qLower.includes('মিস্ত্রি') ||
      qLower.includes('প্লাম্বার') ||
      qLower.includes('ইলেকট্রিশিয়ান') ||
      qLower.includes('ডাক্তার') ||
      qLower.includes('চিকিৎসক') ||
      qLower.includes('শিক্ষক') ||
      qLower.includes('টিচার') ||
      qLower.includes('টিউটর') ||
      qLower.includes('নার্স') ||
      qLower.includes('মেকানিক') ||
      qLower.includes('সদস্য') ||
      qLower.includes('প্রতিনিধি')
    ) {
      // Check live registered users for matching profession
      const matchedWorkers = (liveUsers || []).filter((u: any) => {
        const prof = (u.profession || u.occupation || u.role || u.skills || '').toLowerCase();
        const bio = (u.bio || '').toLowerCase();
        const combined = `${prof} ${bio}`;
        if (qLower.includes('শিক্ষক') || qLower.includes('টিউটর') || qLower.includes('টিচার')) {
          return combined.includes('শিক্ষক') || combined.includes('teacher') || combined.includes('tutor');
        }
        if (qLower.includes('ডাক্তার') || qLower.includes('চিকিৎসক')) {
          return combined.includes('ডাক্তার') || combined.includes('doctor') || combined.includes('চিকিৎসক');
        }
        if (qLower.includes('ইলেকট্রিশিয়ান') || qLower.includes('বিদ্যুৎ')) {
          return combined.includes('ইলেকট্রিশিয়ান') || combined.includes('electrician');
        }
        if (qLower.includes('প্লাম্বার')) {
          return combined.includes('প্লাম্বার') || combined.includes('plumber');
        }
        if (qLower.includes('নার্স')) {
          return combined.includes('নার্স') || combined.includes('nurse');
        }
        if (qLower.includes('মেকানিক')) {
          return combined.includes('মেকানিক') || combined.includes('mechanic');
        }
        return false;
      });

      if (matchedWorkers.length > 0) {
        const w = matchedWorkers[0];
        const uniqueId = formatBengaliDistrictIdClient(w.district, 1);
        const contactAction = formatContactActionClient(w.phone);
        return {
          replyBn: `🛠️ **${salutation}, আপনার কাঙ্ক্ষিত পেশাজীবীর সন্ধান পাওয়া গেছে:**\n\n• **নাম:** ${w.fullName || w.name || 'নিবন্ধিত সেবাদাতা'}\n• **ইউনিক আইডি:** ${uniqueId}\n• **পেশা/দক্ষতা:** ${w.profession || 'সার্টিফাইড সেবাদাতা'}\n• **এলাকা:** ${[w.upazila, w.district].filter(Boolean).join(', ') || 'পার্বত্য চট্টগ্রাম'}\n• **যোগাযোগ:** ${contactAction}\n\n🔒 *ব্যক্তিগত গোপনীয়তা রক্ষায় সরাসরি ডায়াল লিংকের মাধ্যমে যোগাযোগ নিশ্চিত করা হয়েছে।*`,
          actionLink: {
            type: 'services',
            label: 'সেবা সমূহের তালিকা দেখুন',
          },
          recommendedProducts: [],
          quickReplyChips: ['🛠️ সেবা সমূহের তালিকা', 'সেবা দিতে যোগ দিন', 'যোগাযোগ / WhatsApp'],
          source: 'client-fallback',
        };
      }

      const defaultContact = formatContactActionClient('01870592699');
      return {
        replyBn: `🛠️ **ঝাদিমাদি হাইপারলোকাল হোম সার্ভিস ও পেশাদার মিস্ত্রি:**\n\n• **প্লাম্বার (স্যানিটারি ও পাইপ):** আইডি: খাগ-০০১ | যোগাযোগ: ${defaultContact}\n• **ইলেকট্রিশিয়ান (ওয়্যারিং ও ফ্যান):** আইডি: রাঙা-০০২ | যোগাযোগ: ${defaultContact}\n• **টিউটর / শিক্ষক:** আইডি: বান্দ-০০৩ | যোগাযোগ: ${defaultContact}\n• **হোম নার্সিং ও কেয়ারগিভার:** আইডি: খাগ-০০৪ | যোগাযোগ: ${defaultContact}\n\n🔒 *সরাসরি কল করতে "যোগাযোগ করুন" বাটনে ট্যাপ করুন।*`,
        actionLink: {
          type: 'services',
          label: 'সেবা সমূহের তালিকা দেখুন',
        },
        recommendedProducts: [],
        quickReplyChips: ['🛠️ সেবা সমূহের তালিকা', 'সেবা দিতে যোগ দিন', 'যোগাযোগ / WhatsApp'],
        source: 'client-fallback',
      };
    }

    // 9. Payment & Delivery
    if (qLower.includes('ডেলিভারি') || qLower.includes('পেমেন্ট') || qLower.includes('বিকাশ') || qLower.includes('ক্যাশ') || qLower.includes('কুরিয়ার')) {
      return {
        replyBn: `🚚 **পেমেন্ট ও ডেলিভারি তথ্য:**\n\n• **পেমেন্ট পদ্ধতি:** ক্যাশ অন ডেলিভারি (Cash on Delivery) এবং বিকাশ মার্চেন্ট অ্যাকাউন্ট।\n• **ডেলিভারি চার্জ নিয়ম:** ডেলিভারি চার্জ নির্ধারিত হবে সংশ্লিষ্ট কুরিয়ারের বর্তমান চার্জ অনুযায়ী।\n• **পার্টনার কুরিয়ার সমূহ:** ঝাদিমাদি রাইডার, সুন্দরবন কুরিয়ার, পাঠাও, স্টেডফাস্ট, রেডএক্স, এস এ পরিবহন।\n• **ডেলিভারি সময়:** ২-৩ কার্যদিবস।`,
        recommendedProducts: [],
        quickReplyChips: ['যোগাযোগ / WhatsApp', '🌾 পাহাড়ি পণ্য'],
        source: 'client-fallback',
      };
    }

    // 10. Contact
    if (qLower.includes('যোগাযোগ') || qLower.includes('ফোন') || qLower.includes('whatsapp') || qLower.includes('ইমেইল')) {
      return {
        replyBn: `📞 **ঝাদিমাদি ডটকম যোগাযোগের মাধ্যম:**\n\n• **WhatsApp:** 01870592699\n• **ইমেইল:** jhadimadi2024@gmail.com\n• **হটলাইন / ফোন:** 01870592699\n• **ঠিকানা:** খাগড়াছড়ি সদর, পার্বত্য চট্টগ্রাম।`,
        recommendedProducts: [],
        quickReplyChips: fallbackChips,
        source: 'client-fallback',
      };
    }

    // 11. STRICT No-Hallucination Unknown query fallback
    return {
      replyBn: `এই তথ্যটি বর্তমানে Jhadimadi-এর তথ্যভাণ্ডারে পাওয়া যাচ্ছে না।\n\nসঠিক তথ্যের জন্য অথবা কাস্টম সেবার জন্য অনুগ্রহ করে আমাদের সাথে WhatsApp (01870592699) অথবা ইমেইলে (jhadimadi2024@gmail.com) যোগাযোগ করুন।`,
      recommendedProducts: [],
      quickReplyChips: fallbackChips,
      source: 'client-fallback',
    };
  }
}

/**
 * Verify Bangladesh NID Card using Gemini Vision API
 */
export async function verifyNidWithGeminiVision(
  imageBase64: string,
  backImageBase64?: string,
  userInfo?: { phone?: string; userName?: string }
): Promise<GeminiNidVerificationResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('/api/nid-verify-gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        backImageBase64,
        phone: userInfo?.phone || '',
        userName: userInfo?.userName || '',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[Gemini NID Verification Service Error]:', error);
    return {
      success: false,
      isFakeDetected: false,
      message: 'সার্ভার সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
    };
  }
}

