-- ====================================================
-- JHADIMADI.COM SUPABASE RLS INTEGRATION WITH RBAC
-- Migration 003: Tighten RLS for orders, verifications, products & storage
-- ====================================================

-- 1. Tighten Orders RLS with public.is_admin()
DROP POLICY IF EXISTS "Admins can view and manage all orders" ON public.orders;
CREATE POLICY "Admins can view and manage all orders" 
  ON public.orders FOR ALL 
  USING (
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

-- 2. Tighten Verifications RLS with public.is_admin()
DROP POLICY IF EXISTS "Admins can manage all verifications" ON public.verifications;
CREATE POLICY "Admins can manage all verifications" 
  ON public.verifications FOR ALL 
  USING (
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

-- 3. Products RLS: Allow Admins to manage and moderate all products
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" 
  ON public.products FOR ALL 
  USING (
    public.is_admin(auth.uid()) OR 
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('super_admin', 'admin')
  );

-- 4. Storage NID Documents: Allow Admins to view verification files
DROP POLICY IF EXISTS "NID documents only accessible by owner and admin" ON storage.objects;
CREATE POLICY "NID documents only accessible by owner and admin" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'nid_documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin(auth.uid()) OR
      coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'super_admin')
    )
  );
