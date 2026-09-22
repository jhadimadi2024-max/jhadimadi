-- =========================================================================
-- JHADIMADI.COM - FIX HTTP 401 UNAUTHORIZED (POSTGREST ERROR 42501)
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dwhsqftllkximhfvwqak/sql/new
-- =========================================================================

-- 1. Grant Schema Usage to Anon, Authenticated, and Service Role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant Table, Sequence, and Routine Privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Set Default Privileges for all Future Tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 4. Disable RLS and Ensure Grants on Every Table in Public Schema
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
      EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', r.tablename);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped table % due to error', r.tablename;
    END;
  END LOOP;
END $$;
