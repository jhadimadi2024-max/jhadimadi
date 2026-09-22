export type AiSeverity = 'CRITICAL' | 'ATTENTION' | 'WARNING' | 'POSITIVE' | 'OPPORTUNITY';
export type AiTaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AiIntelligenceItem {
  id: string;
  category: AiSeverity;
  title: string;
  descriptionBn: string;
  metric?: string;
  suggestedAction?: string;
  actionTab?: string;
  actionPayload?: any;
  detectedAt?: string;
}

export interface AiPriorityTask {
  id: string;
  priority: AiTaskPriority;
  title: string;
  problemBn: string;
  whyItMattersBn: string;
  suggestedActionBn: string;
  actionTab?: string;
  actionLabelBn: string;
  requiresConfirmation?: boolean;
}

export interface AiDailyBriefingData {
  headlineBn: string;
  summaryBn: string;
  generatedAt: string;
  bulletPoints: string[];
  businessStatus: 'EXCELLENT' | 'STABLE' | 'ATTENTION_NEEDED' | 'CRITICAL';
  topOpportunityBn: string;
  urgentActionBn: string;
  keyStatsSnapshot: {
    totalRevenue: number;
    todayOrders: number;
    activeVisitors: number;
    pendingKyc: number;
    lowStockCount: number;
    unresolvedComplaints: number;
  };
}

export interface AiProductInsightItem {
  id: string;
  name: string;
  category: string;
  views: number;
  orders: number;
  stock: number;
  price: number;
  revenue: number;
  statusTag: 'BEST_PERFORMING' | 'FAST_GROWING' | 'LOW_DEMAND' | 'HIGH_VIEW_LOW_PURCHASE' | 'LOW_STOCK' | 'OPPORTUNITY';
  aiAnalysisBn: string;
  stockOutDaysEstimate?: number;
}

export interface AiSearchInsightItem {
  keyword: string;
  count: number;
  category: string;
  hasResults: boolean;
  resultCount: number;
  trend: 'up' | 'down' | 'steady';
  aiRecommendationBn: string;
}

export interface AiCustomerInsightData {
  commonComplaints: Array<{
    category: 'Product' | 'Delivery' | 'Service' | 'App' | 'Payment';
    count: number;
    summaryBn: string;
    actionRequiredBn: string;
  }>;
  commonRequests: Array<{
    requestBn: string;
    popularity: 'HIGH' | 'MEDIUM' | 'EMERGING';
    notesBn: string;
  }>;
  sentimentScorePercent: number; // 0 to 100
  unresolvedCount: number;
  keyInsightsSummaryBn: string;
}

export interface AiAnomalyItem {
  id: string;
  metricName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  detectedAt: string;
  changeDescriptionBn: string;
  probableCausesBn: string[];
  recommendedChecksBn: string[];
}

export interface AiAppHealthData {
  status: 'EXCELLENT' | 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  score: number; // 0 - 100
  apiLatencyMs: number;
  supabaseConnected: boolean;
  errorRatePercent: number;
  securityStatus: 'SECURE' | 'AUDIT_ALERT' | 'REVIEW_NEEDED';
  securityNotesBn: string;
  districtConnectivity: Array<{
    district: string;
    status: 'FAST' | 'NORMAL' | 'SLOW';
    latencyMs: number;
  }>;
}

export interface AiCommandCenterPayload {
  intelligenceSummary: {
    critical: AiIntelligenceItem[];
    attention: AiIntelligenceItem[];
    warnings: AiIntelligenceItem[];
    positive: AiIntelligenceItem[];
    opportunities: AiIntelligenceItem[];
  };
  priorityTasks: AiPriorityTask[];
  dailyBriefing: AiDailyBriefingData;
  productInsights: {
    bestPerforming: AiProductInsightItem[];
    fastGrowing: AiProductInsightItem[];
    lowDemand: AiProductInsightItem[];
    highViewLowPurchase: AiProductInsightItem[];
    lowStock: AiProductInsightItem[];
  };
  searchInsights: {
    topSearches: AiSearchInsightItem[];
    missingDemand: AiSearchInsightItem[];
    emergingTrends: AiSearchInsightItem[];
  };
  customerInsights: AiCustomerInsightData;
  anomalies: AiAnomalyItem[];
  appHealth: AiAppHealthData;
  generatedAt: string;
  modelUsed: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  relatedActionTab?: string;
  relatedActionLabel?: string;
  suggestedFollowUps?: string[];
  isAudioPlaying?: boolean;
}

export interface AiBusinessContext {
  businessName: string;
  tagline: string;
  missionBn: string;
  targetRegions: string[];
  priorityCategories: string[];
  customRulesBn: string[];
  commissionPolicyBn: string;
  lastUpdated: string;
}

export type AiReportType = 'daily' | 'weekly' | 'monthly' | 'product' | 'sales' | 'inventory' | 'customer' | 'health';
