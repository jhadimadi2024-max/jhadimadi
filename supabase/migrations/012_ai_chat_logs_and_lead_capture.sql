-- Migration 012: AI Chat Logs & Direct Lead Capture System
-- Records customer interactions with Jhadimadi AI, intent tagging (order_request / general_inquiry),
-- and captures lead details (customer name, phone, address, requested product) for Admin follow-up.

CREATE TABLE IF NOT EXISTS public.ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  customer_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  detected_intent TEXT NOT NULL DEFAULT 'Inquiry', -- 'Order' | 'Inquiry' | 'Search'
  intent_tag TEXT NOT NULL DEFAULT 'general_inquiry', -- 'order_request' | 'general_inquiry'
  intent_category TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  product_requested TEXT,
  status TEXT NOT NULL DEFAULT 'new_lead', -- 'new_lead' | 'contacted' | 'converted' | 'archived'
  admin_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization indexes for fast search and analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_timestamp ON public.ai_chat_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_intent ON public.ai_chat_logs(detected_intent);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_intent_tag ON public.ai_chat_logs(intent_tag);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_status ON public.ai_chat_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user ON public.ai_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_session ON public.ai_chat_logs(session_id);

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

-- 1. Insert Policy: Anyone (authenticated or guest session) can insert conversation logs
DROP POLICY IF EXISTS "Allow chat logging" ON public.ai_chat_logs;
CREATE POLICY "Allow chat logging" ON public.ai_chat_logs
  FOR INSERT WITH CHECK (true);

-- 2. Staff Policy: Administrators and staff can view, filter, and manage all logs and leads
DROP POLICY IF EXISTS "Staff manage chat logs" ON public.ai_chat_logs;
CREATE POLICY "Staff manage chat logs" ON public.ai_chat_logs
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR EXISTS (SELECT 1 FROM public.is_staff(auth.uid()) WHERE is_staff = true)
  );

COMMENT ON TABLE public.ai_chat_logs IS 'Real-time AI customer conversation logs with intent detection, order leads, and conversion status.';
