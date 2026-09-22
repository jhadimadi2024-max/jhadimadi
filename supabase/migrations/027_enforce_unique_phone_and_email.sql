-- =========================================================================
-- MIGRATION 027: ENFORCE STRICT UNIQUE CONSTRAINTS FOR PHONE & EMAIL
-- =========================================================================
-- Platform: Jhadimadi.com
-- Purpose:
--   1. Ensure a phone number can only be registered ONCE across the platform.
--   2. Ensure an email address can only be registered ONCE across the platform.
--   3. Gracefully handle unique constraints without failing on null/empty placeholders.
-- =========================================================================

-- 1. Unique index on non-empty, non-null phone numbers in public.profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_phone_strict
ON public.profiles (phone)
WHERE phone IS NOT NULL AND TRIM(phone) != '';

-- 2. Unique index on non-empty, genuine emails in public.profiles (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_email_strict
ON public.profiles (LOWER(TRIM(email)))
WHERE email IS NOT NULL 
  AND TRIM(email) != '' 
  AND email NOT LIKE '%@jhadimadi.com' 
  AND email NOT LIKE '%placeholder%';

-- 3. Comment explaining constraint enforcement
COMMENT ON INDEX idx_profiles_unique_phone_strict IS 'Enforces 1 account per phone number across Jhadimadi.com';
COMMENT ON INDEX idx_profiles_unique_email_strict IS 'Enforces 1 account per email address across Jhadimadi.com';
