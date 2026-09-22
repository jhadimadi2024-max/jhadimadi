-- ============================================================================
-- JHADIMADI.COM — PRIVATE NID STORAGE ROW LEVEL SECURITY
-- Migration: 20260920_private_nid_storage_rls.sql
-- ============================================================================

-- Ensure bucket 'nid_documents' exists as private bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nid_documents',
  'nid_documents',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- Drop existing loose policies on nid_documents
DROP POLICY IF EXISTS "Public can view nid_documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload nid_documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own NID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own NID documents" ON storage.objects;

-- Only authenticated users can upload their own NID documents
CREATE POLICY "Users can upload own NID documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'nid_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only read their own NID documents, admins can read all
CREATE POLICY "Users can view own NID documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'nid_documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
    )
  )
);
