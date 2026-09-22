import { supabase, isSupabaseConfigured } from '../supabase';

/* ==========================================================================
   EXACT USER-FACING NOTIFICATION ALERT MESSAGES
   ========================================================================== */
export const DUPLICATE_CONSTRAINT_ERROR_MESSAGE =
  'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।';

export const DUPLICATE_MESSAGES = {
  phone: 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।',
  nid: 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।',
  email: 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।',
} as const;

export function isUniqueConstraintError(err: any): boolean {
  if (!err) return false;
  if (err.code === '23505' || err.code === 23505) return true;
  const msg = String(err.message || err.error || err.errorMessage || err || '').toLowerCase();
  return (
    msg.includes('23505') ||
    msg.includes('duplicate key') ||
    msg.includes('unique constraint') ||
    msg.includes('already exists') ||
    msg.includes('পূর্বেই রেজিস্ট্রেশন')
  );
}

export interface DuplicateCheckRequest {
  phone?: string;
  nid?: string;
  email?: string;
  role?: string;
  excludeId?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  field?: 'phone' | 'nid' | 'email';
  message?: string;
  details?: {
    table?: string;
    matchedValue?: string;
    existingName?: string;
  };
}

/**
 * Normalizes a Bangladeshi mobile number into standard 11 digits (e.g. 01712345678)
 */
export const normalizeBangladeshPhone = (value?: string | null): string => {
  if (!value) return '';
  let phone = value.trim().replace(/[\s\-()]/g, '');
  if (phone.startsWith('+880')) {
    phone = '0' + phone.substring(4);
  } else if (phone.startsWith('880')) {
    phone = '0' + phone.substring(3);
  }
  return phone;
};

/**
 * Validates whether string is a valid 11-digit Bangladeshi mobile number
 */
export const isValidBangladeshPhone = (phone?: string | null): boolean => {
  if (!phone) return false;
  const clean = normalizeBangladeshPhone(phone);
  return /^01[3-9]\d{8}$/.test(clean);
};

/**
 * Normalizes email address
 */
export const normalizeEmail = (email?: string | null): string => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

/**
 * Check Phone Number Uniqueness against Supabase and Backend API
 */
export async function checkPhoneUniqueness(
  phone: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const cleanPhone = normalizeBangladeshPhone(phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return { isDuplicate: false };
  }

  // 1. Try server-side validation endpoint first (bypasses RLS restrictions)
  try {
    const res = await fetch('/api/registration/check-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, excludeId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.isDuplicate && data.field === 'phone') {
        return {
          isDuplicate: true,
          field: 'phone',
          message: DUPLICATE_MESSAGES.phone,
          details: data.details,
        };
      }
    }
  } catch (apiErr) {
    console.warn('[DuplicateCheck] Server phone check warning:', apiErr);
  }

  // 2. Direct Supabase Query checks across all relevant tables
  if (isSupabaseConfigured && supabase) {
    const phoneVariants = [
      cleanPhone,
      `+88${cleanPhone}`,
      `+880${cleanPhone.replace(/^0/, '')}`,
      `88${cleanPhone}`,
    ];
    const orFilter = phoneVariants.map((p) => `phone.eq.${p}`).join(',');
    const orPhoneNumFilter = phoneVariants.map((p) => `phone_number.eq.${p}`).join(',');

    try {
      // Check 'profiles' table
      const { data: profileRows, error: profErr } = await supabase
        .from('profiles')
        .select('id, phone, full_name')
        .or(orFilter)
        .limit(2);

      if (!profErr && profileRows && profileRows.length > 0) {
        const match = profileRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'phone',
            message: DUPLICATE_MESSAGES.phone,
            details: { table: 'profiles', matchedValue: match.phone, existingName: match.full_name },
          };
        }
      }
    } catch (_) {}

    // Check 'permanent_members' table
    try {
      const { data: memberRows, error: memErr } = await supabase
        .from('permanent_members')
        .select('id, phone_number, name')
        .or(orPhoneNumFilter)
        .limit(2);

      if (!memErr && memberRows && memberRows.length > 0) {
        const match = memberRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'phone',
            message: DUPLICATE_MESSAGES.phone,
            details: { table: 'permanent_members', matchedValue: match.phone_number, existingName: match.name },
          };
        }
      }
    } catch (_) {}

    // Check 'service_providers' table
    try {
      const { data: proRows, error: proErr } = await supabase
        .from('service_providers')
        .select('id, phone, name')
        .or(orFilter)
        .limit(2);

      if (!proErr && proRows && proRows.length > 0) {
        const match = proRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'phone',
            message: DUPLICATE_MESSAGES.phone,
            details: { table: 'service_providers', matchedValue: match.phone, existingName: match.name },
          };
        }
      }
    } catch (_) {}

    // Check 'blood_donors' table
    try {
      const { data: donorRows, error: donorErr } = await supabase
        .from('blood_donors')
        .select('id, phone, name')
        .or(orFilter)
        .limit(2);

      if (!donorErr && donorRows && donorRows.length > 0) {
        const match = donorRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'phone',
            message: DUPLICATE_MESSAGES.phone,
            details: { table: 'blood_donors', matchedValue: match.phone, existingName: match.name },
          };
        }
      }
    } catch (_) {}

    // Check 'product_sellers' table
    try {
      const { data: sellerRows, error: sellerErr } = await supabase
        .from('product_sellers')
        .select('id, phone_number, shop_name')
        .or(orPhoneNumFilter)
        .limit(2);

      if (!sellerErr && sellerRows && sellerRows.length > 0) {
        const match = sellerRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'phone',
            message: DUPLICATE_MESSAGES.phone,
            details: { table: 'product_sellers', matchedValue: match.phone_number, existingName: match.shop_name },
          };
        }
      }
    } catch (_) {}

    // Check 'sellers' table
    try {
      const { data: sRows, error: sErr } = await supabase
        .from('sellers')
        .select('id, phone, shop_name')
        .or(orFilter)
        .limit(2);

      if (!sErr && sRows && sRows.length > 0) {
        const match = sRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'phone',
            message: DUPLICATE_MESSAGES.phone,
            details: { table: 'sellers', matchedValue: match.phone, existingName: match.shop_name },
          };
        }
      }
    } catch (_) {}
  }

  return { isDuplicate: false };
}

/**
 * Check NID Number Uniqueness against Supabase and Backend API
 */
export async function checkNidUniqueness(
  nid: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const cleanNid = (nid || '').trim();
  if (!cleanNid || cleanNid.length < 5) {
    return { isDuplicate: false };
  }

  // 1. Try server-side validation endpoint first
  try {
    const res = await fetch('/api/registration/check-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nid: cleanNid, excludeId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.isDuplicate && data.field === 'nid') {
        return {
          isDuplicate: true,
          field: 'nid',
          message: DUPLICATE_MESSAGES.nid,
          details: data.details,
        };
      }
    }
  } catch (apiErr) {
    console.warn('[DuplicateCheck] Server NID check warning:', apiErr);
  }

  // 2. Direct Supabase Query checks across permanent_members, profiles, etc.
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: memberRows, error: memErr } = await supabase
        .from('permanent_members')
        .select('id, nid_number, name')
        .eq('nid_number', cleanNid)
        .limit(2);

      if (!memErr && memberRows && memberRows.length > 0) {
        const match = memberRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'nid',
            message: DUPLICATE_MESSAGES.nid,
            details: { table: 'permanent_members', matchedValue: match.nid_number, existingName: match.name },
          };
        }
      }
    } catch (_) {}

    try {
      const { data: profileRows, error: profErr } = await supabase
        .from('profiles')
        .select('id, nid_number, full_name')
        .eq('nid_number', cleanNid)
        .limit(2);

      if (!profErr && profileRows && profileRows.length > 0) {
        const match = profileRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'nid',
            message: DUPLICATE_MESSAGES.nid,
            details: { table: 'profiles', matchedValue: match.nid_number, existingName: match.full_name },
          };
        }
      }
    } catch (_) {}

    try {
      const { data: proRows, error: proErr } = await supabase
        .from('service_providers')
        .select('id, nid_number, name')
        .eq('nid_number', cleanNid)
        .limit(2);

      if (!proErr && proRows && proRows.length > 0) {
        const match = proRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'nid',
            message: DUPLICATE_MESSAGES.nid,
            details: { table: 'service_providers', matchedValue: match.nid_number, existingName: match.name },
          };
        }
      }
    } catch (_) {}
  }

  return { isDuplicate: false };
}

/**
 * Check Email Address Uniqueness against Supabase and Backend API
 */
export async function checkEmailUniqueness(
  email: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { isDuplicate: false };
  }

  // 1. Try server-side validation endpoint first
  try {
    const res = await fetch('/api/registration/check-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, excludeId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.isDuplicate && data.field === 'email') {
        return {
          isDuplicate: true,
          field: 'email',
          message: DUPLICATE_MESSAGES.email,
          details: data.details,
        };
      }
    }
  } catch (apiErr) {
    console.warn('[DuplicateCheck] Server email check warning:', apiErr);
  }

  // 2. Direct Supabase Query checks across profiles, service_providers, sellers
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: profileRows, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', cleanEmail)
        .limit(2);

      if (!profErr && profileRows && profileRows.length > 0) {
        const match = profileRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'email',
            message: DUPLICATE_MESSAGES.email,
            details: { table: 'profiles', matchedValue: match.email, existingName: match.full_name },
          };
        }
      }
    } catch (_) {}

    try {
      const { data: proRows, error: proErr } = await supabase
        .from('service_providers')
        .select('id, email, name')
        .ilike('email', cleanEmail)
        .limit(2);

      if (!proErr && proRows && proRows.length > 0) {
        const match = proRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'email',
            message: DUPLICATE_MESSAGES.email,
            details: { table: 'service_providers', matchedValue: match.email, existingName: match.name },
          };
        }
      }
    } catch (_) {}

    try {
      const { data: sRows, error: sErr } = await supabase
        .from('sellers')
        .select('id, email, shop_name')
        .ilike('email', cleanEmail)
        .limit(2);

      if (!sErr && sRows && sRows.length > 0) {
        const match = sRows.find((r: any) => !excludeId || r.id !== excludeId);
        if (match) {
          return {
            isDuplicate: true,
            field: 'email',
            message: DUPLICATE_MESSAGES.email,
            details: { table: 'sellers', matchedValue: match.email, existingName: match.shop_name },
          };
        }
      }
    } catch (_) {}
  }

  return { isDuplicate: false };
}

/**
 * Master Duplicate Data Validation function for all 4 registration forms
 * Validates in order: Phone -> NID -> Email
 * Returns first detected duplicate with its exact alert message.
 */
export async function validateRegistrationDuplicates(
  params: DuplicateCheckRequest
): Promise<DuplicateCheckResult> {
  const { phone, nid, email, excludeId } = params;

  // 1. Phone Number Uniqueness Check (Mandatory across all 4 forms)
  if (phone) {
    const phoneRes = await checkPhoneUniqueness(phone, excludeId);
    if (phoneRes.isDuplicate) {
      return phoneRes;
    }
  }

  // 2. NID Number Uniqueness Check (Permanent Member & Candidate forms)
  if (nid) {
    const nidRes = await checkNidUniqueness(nid, excludeId);
    if (nidRes.isDuplicate) {
      return nidRes;
    }
  }

  // 3. Email Uniqueness Check (Where applicable / if provided)
  if (email && email.trim()) {
    const emailRes = await checkEmailUniqueness(email, excludeId);
    if (emailRes.isDuplicate) {
      return emailRes;
    }
  }

  return { isDuplicate: false };
}
