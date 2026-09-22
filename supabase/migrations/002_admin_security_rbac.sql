-- ====================================================
-- JHADIMADI.COM SUPABASE ADMIN SECURITY & RBAC MIGRATION
-- Migration 002: Role-Based Access Control, Activity Logs & Security Hardening
-- ====================================================

-- 1. Admin Roles Table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON public.admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON public.admin_roles(role);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 2. Helper Security Functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.admin_roles 
  WHERE user_id = user_uuid AND is_active = TRUE 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = user_uuid 
      AND is_active = TRUE 
      AND role IN ('super_admin', 'admin', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = user_uuid 
      AND is_active = TRUE 
      AND role = 'super_admin'
  );
$$;

-- 3. Row Level Security Policies for admin_roles
-- Users can view their own role; Super Admins and Admins can view all admin roles
DROP POLICY IF EXISTS "Admins can view admin roles" ON public.admin_roles;
CREATE POLICY "Admins can view admin roles" 
  ON public.admin_roles FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

-- ONLY Super Admin can insert new admin roles
DROP POLICY IF EXISTS "Only Super Admin can insert admin roles" ON public.admin_roles;
CREATE POLICY "Only Super Admin can insert admin roles" 
  ON public.admin_roles FOR INSERT 
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- ONLY Super Admin can update admin roles (prevent self-promotion and unauthorized modifications)
DROP POLICY IF EXISTS "Only Super Admin can update admin roles" ON public.admin_roles;
CREATE POLICY "Only Super Admin can update admin roles" 
  ON public.admin_roles FOR UPDATE 
  USING (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  )
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- ONLY Super Admin can delete admin roles
DROP POLICY IF EXISTS "Only Super Admin can delete admin roles" ON public.admin_roles;
CREATE POLICY "Only Super Admin can delete admin roles" 
  ON public.admin_roles FOR DELETE 
  USING (
    public.is_super_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- 4. Admin Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ROLE_CHANGE', 'DELETE_USER', 'DELETE_PRODUCT', 'DELETE_ORDER', 'SETTING_CHANGE'
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.admin_activity_logs(action_type);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity Logs Policies:
-- Only Super Admins and Admins can view activity logs
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view activity logs" 
  ON public.admin_activity_logs FOR SELECT 
  USING (
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

-- Authenticated admins can insert their own log records
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can insert activity logs" 
  ON public.admin_activity_logs FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = admin_user_id OR 
      public.is_admin(auth.uid())
    )
  );

-- Logs are immutable: no UPDATE or DELETE permitted
-- (Omitted update/delete policies guarantee no modifications or deletions)
