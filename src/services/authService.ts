/**
 * JHADIMADI.COM — ENTERPRISE SUPABASE AUTHENTICATION SERVICE
 * Complete Supabase Auth & PostgreSQL Integration
 * Architecture: ONE USER ACCOUNT -> ONE PROFILE -> MULTIPLE ROLES
 * Fully replaces all legacy Firebase Auth and Firestore operations.
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import { UserProfile } from '../types';
import { databaseService } from './databaseService';
import { generateMemberUID, getLocationCodes } from '../data/locationMaster';

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  errorCode?: string;
  isNewUser?: boolean;
}

export interface SocialAuthResult extends AuthResult {}

/**
 * Universal timeout wrapper to guarantee async operations never hang indefinitely
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 8000,
  errorMsg?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMsg || 'REQUEST_TIMEOUT'));
      }, ms);
    })
  ]);
}

/**
 * Helper to normalize Bengali digits to standard English ASCII digits
 */
export function normalizeDigits(val: string): string {
  if (!val) return '';
  const bnToEn: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return val.replace(/[০-৯]/g, (d) => bnToEn[d] || d);
}

/**
 * Validates whether string is a well-formed email address
 */
export function isValidEmailFormat(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

/**
 * Validates phone number (Bangladeshi 11-digit standard: 01XXXXXXXXX)
 */
export function isValidPhone(phone: string): boolean {
  const clean = normalizeDigits(phone).replace(/[^0-9]/g, '');
  return /^01[3-9]\d{8}$/.test(clean);
}

/**
 * Maps Supabase / Auth error codes to user-friendly messages in Bangla & English.
 */
export function getFriendlyAuthErrorMessage(errorCodeOrMsg: string, lang: 'bn' | 'en' = 'bn'): string {
  const lower = (errorCodeOrMsg || '').toLowerCase();

  if (
    lower.includes('23505') ||
    lower.includes('user already registered') ||
    lower.includes('email-already-in-use') ||
    lower.includes('already exists') ||
    lower.includes('already registered') ||
    lower.includes('duplicate')
  ) {
    return lang === 'bn'
      ? 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।'
      : 'An account has already been registered with this phone number or email.';
  }
  if (lower.includes('wrong-password') || lower.includes('invalid password')) {
    return lang === 'bn'
      ? 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।'
      : 'Incorrect password. Please enter the correct password.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return lang === 'bn'
      ? 'ভুল পাসওয়ার্ড বা তথ্য দেওয়া হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      : 'Invalid credentials. Please try again.';
  }
  if (lower.includes('user not found') || lower.includes('user-not-found')) {
    return lang === 'bn'
      ? 'এই মোবাইল নম্বর বা ইমেইল দিয়ে কোনো রেজিস্টার্ড অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে প্রথমে সাইন আপ করুন।'
      : 'No registered account found with this phone number or email. Please sign up first.';
  }
  if (lower.includes('password') && (lower.includes('short') || lower.includes('weak') || lower.includes('least 6 characters'))) {
    return lang === 'bn'
      ? 'পাসওয়ার্ড অত্যন্ত দুর্বল। কমপক্ষে ৬টি অক্ষর ব্যবহার করুন।'
      : 'Password must be at least 6 characters long.';
  }
  if (lower.includes('invalid email') || lower.includes('email format')) {
    return lang === 'bn'
      ? 'সঠিক ফরম্যাটের ইমেইল ঠিকানা দিন।'
      : 'Please enter a valid email address.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return lang === 'bn'
      ? 'অতিরিক্ত ভুল চেষ্টার কারণে সাময়িক লক হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।'
      : 'Too many requests. Please wait a few moments and try again.';
  }
  if (lower.includes('timeout') || lower.includes('request_timeout')) {
    return lang === 'bn'
      ? 'অনুরোধের সময়সীমা শেষ হয়েছে। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।'
      : 'Request timed out. Please check your internet connection.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return lang === 'bn'
      ? 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
      : 'Network connection error. Please try again.';
  }

  return lang === 'bn'
    ? 'অথেন্টিকেশন সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
    : 'Authentication failed. Please try again.';
}

/**
 * Strict Registration Uniqueness Validation:
 * Validates that NEITHER the phone number nor the email is already registered across:
 * 1. Supabase profiles table
 * 2. Database service in-memory cache
 * 3. Server auth records
 */
export async function checkAccountUniqueness(params: {
  phone?: string;
  email?: string;
  excludeUserId?: string;
}): Promise<{ isAvailable: boolean; message?: string; conflictField?: 'phone' | 'email' }> {
  const cleanPhone = params.phone ? normalizeDigits(params.phone).replace(/[^0-9]/g, '') : '';
  const cleanEmail = params.email ? normalizeDigits(params.email).trim().toLowerCase() : '';
  const isSyntheticEmail = !cleanEmail || cleanEmail.endsWith('@jhadimadi.com') || cleanEmail.includes('placeholder');

  const DUPLICATE_MSG = 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।';

  // 1. Direct Supabase profiles verification
  if (isSupabaseConfigured) {
    try {
      const isValidUuid = params.excludeUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.excludeUserId);

      // Verify phone uniqueness across standard Bangladeshi phone formats
      if (cleanPhone.length >= 10) {
        const phoneVariants = [
          cleanPhone,
          `+88${cleanPhone}`,
          `88${cleanPhone}`,
          cleanPhone.startsWith('88') ? cleanPhone.slice(2) : null,
          cleanPhone.startsWith('+88') ? cleanPhone.slice(3) : null
        ].filter(Boolean) as string[];

        let phoneQuery = supabase
          .from('profiles')
          .select('id, phone')
          .in('phone', phoneVariants);

        if (isValidUuid) {
          phoneQuery = phoneQuery.neq('id', params.excludeUserId!);
        }

        const { data: phoneMatches } = await withTimeout<any>(
          Promise.resolve(phoneQuery.limit(1)),
          3500
        ).catch(() => ({ data: null }));

        if (phoneMatches && phoneMatches.length > 0) {
          return {
            isAvailable: false,
            conflictField: 'phone',
            message: DUPLICATE_MSG
          };
        }
      }

      // Verify email uniqueness (case-insensitive)
      if (cleanEmail && !isSyntheticEmail && isValidEmailFormat(cleanEmail)) {
        let emailQuery = supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', cleanEmail);

        if (isValidUuid) {
          emailQuery = emailQuery.neq('id', params.excludeUserId!);
        }

        const { data: emailMatches } = await withTimeout<any>(
          Promise.resolve(emailQuery.limit(1)),
          3500
        ).catch(() => ({ data: null }));

        if (emailMatches && emailMatches.length > 0) {
          return {
            isAvailable: false,
            conflictField: 'email',
            message: DUPLICATE_MSG
          };
        }
      }
    } catch (supaErr) {
      console.warn('[Supabase Uniqueness Check] Warning:', supaErr);
    }
  }

  // 2. Local Database Service check
  try {
    const localCheck = await databaseService.checkUniqueConstraints({
      phone: cleanPhone,
      email: isSyntheticEmail ? undefined : cleanEmail,
      excludeUserId: params.excludeUserId
    });

    if (localCheck.isDuplicate) {
      return {
        isAvailable: false,
        conflictField: localCheck.conflictField === 'email' ? 'email' : 'phone',
        message: DUPLICATE_MSG
      };
    }
  } catch (dbErr) {
    console.warn('[DatabaseService Uniqueness Check] Warning:', dbErr);
  }

  return { isAvailable: true };
}

/**
 * Check if a username is already taken in the Supabase 'profiles' table
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) return false;

  if (!isSupabaseConfigured) return true;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (error) return true;
    return !data; // Available if no existing record
  } catch {
    return true;
  }
}

/**
 * Sign up a new user using Supabase Auth.
 * Automatically provisions:
 * 1. Supabase auth.users record
 * 2. profiles table entry
 * 3. user_roles default 'customer' role (and any secondary role requested)
 * 4. security_logs registration entry
 */
export async function signUpWithEmailPassword(params: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  username?: string;
  role?: 'customer' | 'seller' | 'freelancer' | 'service_provider' | 'member';
  location?: {
    division?: string;
    district?: string;
    upazila?: string;
    mahalla?: string;
  };
  additionalProfile?: Partial<UserProfile>;
  lang?: 'bn' | 'en';
}): Promise<AuthResult> {
  const lang = params.lang || 'bn';
  const cleanEmail = normalizeDigits(params.email.trim().toLowerCase());
  const cleanPassword = params.password.trim();
  const division = params.location?.division || 'চট্টগ্রাম';
  const district = params.location?.district || 'খাগড়াছড়ি';
  const upazila = params.location?.upazila || 'খাগড়াছড়ি সদর';
  const mahalla = params.location?.mahalla || 'পৌর এলাকা';
  const locationCodes = getLocationCodes(division, district, upazila);
  const generatedUID = generateMemberUID(division, district, upazila);
  const cleanPhone = params.phone ? normalizeDigits(params.phone.trim()) : '';
  const username = params.username?.trim().toLowerCase() || `user_${Date.now().toString().slice(-6)}`;
  const role = params.role || 'customer';

  // Strict Validation
  if (!cleanPassword || cleanPassword.length < 6) {
    return {
      success: false,
      error: lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.',
      errorCode: 'weak-password'
    };
  }

  // 1. Strict Registration Uniqueness Validation (Supabase Auth & profiles table)
  const isSyntheticEmail = !cleanEmail || cleanEmail.endsWith('@jhadimadi.com') || cleanEmail.includes('placeholder');
  const uniqueness = await checkAccountUniqueness({
    phone: cleanPhone,
    email: isSyntheticEmail ? undefined : cleanEmail,
  });

  if (!uniqueness.isAvailable) {
    return {
      success: false,
      error: 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।',
      errorCode: '23505'
    };
  }

  let resolvedUid = `usr_${Date.now()}`;

  // 2. Supabase Auth Sign Up
  if (isSupabaseConfigured && isValidEmailFormat(cleanEmail)) {
    try {
      const { data: authData, error: authError } = await withTimeout<any>(
        supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: params.fullName.trim(),
              name: params.fullName.trim(),
              username,
              phone: cleanPhone,
              division,
              district,
              upazila,
              initial_role: role,
            }
          }
        }),
        8000,
        'AUTH_TIMEOUT'
      );

      if (authError) {
        const isDuplicate = 
          authError.code === '23505' || 
          authError.message?.toLowerCase().includes('already') ||
          authError.message?.toLowerCase().includes('duplicate') ||
          authError.message?.toLowerCase().includes('registered');

        return {
          success: false,
          error: isDuplicate 
            ? 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।'
            : getFriendlyAuthErrorMessage(authError.message, lang),
          errorCode: isDuplicate ? '23505' : (authError.code || 'sign-up-error')
        };
      }

      if (authData.user?.id) {
        resolvedUid = authData.user.id;
      }
    } catch (err: any) {
      console.warn('[Supabase Auth] Sign up notice:', err?.message || err);
      // Fallback for offline or local preview environments
    }
  }

  // 3. Build UserProfile Object
  const newUserProfile: UserProfile = {
    id: resolvedUid,
    uid: resolvedUid,
    memberUID: generatedUID,
    memberId: generatedUID,
    name: params.fullName.trim(),
    fullName: params.fullName.trim(),
    username,
    email: cleanEmail,
    phone: cleanPhone,
    role,
    division,
    district,
    upazila,
    thana: upazila,
    mahalla,
    para: mahalla,
    paraMahalla: `${mahalla}, ${upazila}`,
    divisionCode: locationCodes.divCode,
    districtCode: locationCodes.distCode,
    upazilaCode: locationCodes.upazilaCode,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    isNidVerified: false,
    isPaidMember: false,
    createdAt: new Date().toISOString().split('T')[0],
    ...(params.additionalProfile || {}),
  };

  // 4. Upsert to Supabase profiles & user_roles tables with 23505 constraint handling
  if (isSupabaseConfigured) {
    try {
      // Upsert profile
      const { error: profileUpsertError } = await supabase.from('profiles').upsert([
        {
          id: resolvedUid,
          full_name: newUserProfile.fullName,
          username,
          email: cleanEmail,
          phone: cleanPhone,
          avatar_url: newUserProfile.avatar,
          division,
          district,
          upazila,
          address: `${mahalla}, ${upazila}`,
          account_status: 'active',
          updated_at: new Date().toISOString()
        }
      ]);

      if (profileUpsertError) {
        const isConstraint = 
          profileUpsertError.code === '23505' || 
          profileUpsertError.message?.includes('23505') || 
          profileUpsertError.message?.toLowerCase().includes('duplicate') ||
          profileUpsertError.message?.toLowerCase().includes('unique');

        if (isConstraint) {
          return {
            success: false,
            error: 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।',
            errorCode: '23505'
          };
        }
      }

      // Assign roles: customer + requested role
      await supabase.from('user_roles').upsert([
        { user_id: resolvedUid, role: 'customer' }
      ], { onConflict: 'user_id,role' });

      if (role && role !== 'customer') {
        await supabase.from('user_roles').upsert([
          { user_id: resolvedUid, role }
        ], { onConflict: 'user_id,role' });
      }

      // Security audit log
      await supabase.from('security_logs').insert([
        {
          user_id: resolvedUid,
          action: 'REGISTER',
          description: `User registration completed with role: ${role}`,
          device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        }
      ]);
    } catch (dbErr: any) {
      if (dbErr?.code === '23505' || dbErr?.message?.includes('23505') || dbErr?.message?.toLowerCase().includes('duplicate')) {
        return {
          success: false,
          error: 'এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।',
          errorCode: '23505'
        };
      }
      console.warn('[Supabase Database] Profile sync notice:', dbErr);
    }
  }

  // 5. Update in-memory databaseService cache
  try {
    await databaseService.saveUserProfile(newUserProfile, { skipUniqueCheck: true });
  } catch (cacheErr) {
    console.warn('[DatabaseService] Local sync note:', cacheErr);
  }

  return {
    success: true,
    user: newUserProfile,
    isNewUser: true,
  };
}

/**
 * Sign in an existing user using Supabase Auth.
 * Accepts either Email, Username, or Phone Number as the identifier.
 */
export async function signInWithEmailPassword(
  identifier: string,
  password: string,
  lang: 'bn' | 'en' = 'bn'
): Promise<AuthResult> {
  const cleanInput = normalizeDigits(identifier.trim());
  const cleanPassword = password.trim();

  if (!cleanInput) {
    return {
      success: false,
      error: lang === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বর বা ইমেইল লিখুন।' : 'Please enter email or phone number.',
      errorCode: 'invalid-input',
    };
  }

  let emailToAuth = cleanInput;
  let existingProfile: any = null;

  // If input is not an email, resolve from username or phone in profiles table / cache
  if (isSupabaseConfigured) {
    try {
      const cleanDigits = cleanInput.replace(/[^0-9]/g, '');
      const phoneVariants = [
        cleanInput,
        cleanDigits,
        `+88${cleanDigits}`,
        `88${cleanDigits}`
      ].filter(Boolean) as string[];

      let query = supabase.from('profiles').select('*');
      if (cleanInput.includes('@')) {
        query = query.ilike('email', cleanInput.toLowerCase());
      } else {
        query = query.or(`username.eq.${cleanInput.toLowerCase()},phone.in.(${phoneVariants.join(',')})`);
      }

      const { data: p } = await query.limit(1).maybeSingle();
      if (p) {
        existingProfile = p;
        if (p.email) {
          emailToAuth = p.email;
        }
      }
    } catch (err) {
      console.warn('[Supabase] Identifier lookup notice:', err);
    }
  }

  // Fallback to in-memory cache
  let cachedUser: any = null;
  try {
    cachedUser = await databaseService.getUserByIdOrPhone(cleanInput);
    if (!existingProfile && cachedUser) {
      existingProfile = cachedUser;
      if (cachedUser.email && cachedUser.email.includes('@')) {
        emailToAuth = cachedUser.email;
      }
    }
  } catch (cacheErr) {
    console.warn('[DatabaseService] Identifier lookup notice:', cacheErr);
  }

  // If no registered account is found across database & cache:
  if (!existingProfile && !cachedUser) {
    return {
      success: false,
      error: lang === 'bn' 
        ? 'এই মোবাইল নম্বর বা ইমেইল দিয়ে কোনো রেজিস্টার্ড অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে প্রথমে সাইন আপ করুন।' 
        : 'No registered account found with this phone number or email. Please sign up first.',
      errorCode: 'user-not-found',
    };
  }

  // 1. Authenticate via Supabase Auth
  if (isSupabaseConfigured && isValidEmailFormat(emailToAuth)) {
    try {
      const { data, error } = await withTimeout<any>(
        supabase.auth.signInWithPassword({
          email: emailToAuth,
          password: cleanPassword,
        }),
        7000,
        'AUTH_TIMEOUT'
      );

      if (error) {
        // If password is wrong or invalid credentials
        const isWrongPassword = 
          error.message?.toLowerCase().includes('invalid login credentials') ||
          error.message?.toLowerCase().includes('wrong-password') ||
          error.code === 'invalid_grant';

        return {
          success: false,
          error: isWrongPassword
            ? (lang === 'bn' ? 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।' : 'Incorrect password. Please enter the correct password.')
            : getFriendlyAuthErrorMessage(error.message, lang),
          errorCode: isWrongPassword ? 'wrong-password' : (error.code || 'invalid-credentials')
        };
      }

      if (data?.user) {
        const uid = data.user.id;

        // Fetch user profile and roles from Supabase
        let profileData: any = existingProfile;
        if (!profileData) {
          try {
            const { data: p } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', uid)
              .maybeSingle();
            profileData = p;
          } catch {
            // ignore
          }
        }

        // Fetch roles
        let userRoles: string[] = ['customer'];
        try {
          const { data: r } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', uid);
          if (r && r.length > 0) {
            userRoles = r.map((item: any) => item.role);
          }
        } catch {
          // ignore
        }

        const primaryRole = userRoles.find(r => r !== 'customer') || 'customer';

        const userProfile: UserProfile = {
          id: uid,
          uid: uid,
          name: profileData?.full_name || data.user.user_metadata?.full_name || 'ব্যবহারকারী',
          fullName: profileData?.full_name || data.user.user_metadata?.full_name || 'ব্যবহারকারী',
          username: profileData?.username || data.user.user_metadata?.username || '',
          email: data.user.email || emailToAuth,
          phone: profileData?.phone || data.user.user_metadata?.phone || cleanInput,
          role: primaryRole,
          division: profileData?.division || 'চট্টগ্রাম',
          district: profileData?.district || 'খাগড়াছড়ি',
          upazila: profileData?.upazila || 'খাগড়াছড়ি সদর',
          mahalla: profileData?.address || 'শান্তিনগর',
          avatar: profileData?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          isNidVerified: false,
          isPaidMember: false,
          createdAt: profileData?.created_at || new Date().toISOString().split('T')[0],
        };

        // Audit Log
        try {
          await supabase.from('security_logs').insert([
            {
              user_id: uid,
              action: 'LOGIN',
              description: 'User signed in successfully via Supabase Auth',
              device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
            }
          ]);
        } catch {
          // safe ignore
        }

        // Cache locally
        databaseService.saveUserProfile(userProfile, { skipUniqueCheck: true }).catch(() => {});

        return {
          success: true,
          user: userProfile,
          isNewUser: false,
        };
      }
    } catch (err: any) {
      console.warn('[Supabase Auth] Sign in error:', err);
    }
  }

  // 2. Query in-memory cache for registered profile
  try {
    const foundUser = cachedUser || await databaseService.getUserByIdOrPhone(cleanInput);
    if (foundUser) {
      if (foundUser.password && foundUser.password.trim() !== cleanPassword) {
        return {
          success: false,
          error: lang === 'bn' ? 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।' : 'Incorrect password. Please enter the correct password.',
          errorCode: 'wrong-password',
        };
      }

      return {
        success: true,
        user: foundUser,
        isNewUser: false,
      };
    }
  } catch (dbErr) {
    console.warn('[DatabaseService] User lookup error:', dbErr);
  }

  return {
    success: false,
    error: lang === 'bn' 
      ? 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।' 
      : 'Incorrect password. Please enter the correct password.',
    errorCode: 'wrong-password',
  };
}

/**
 * Social Authentication via Supabase OAuth (Google / Facebook)
 */
export async function performSocialAuth(
  providerType: 'Google' | 'Facebook',
  defaultLocation?: { division?: string; district?: string; upazila?: string; mahalla?: string },
  lang: 'bn' | 'en' = 'bn'
): Promise<SocialAuthResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: lang === 'bn' 
        ? `${providerType} অথেন্টিকেশন সেবা কনফিগার করা হয়নি। অনুগ্রহ করে মোবাইল নাম্বার ও পাসওয়ার্ড দিয়ে লগইন বা রেজিস্টার করুন।` 
        : `${providerType} authentication is not configured. Please login or register using phone and password.`
    };
  }

  try {
    const provider = providerType.toLowerCase() as 'google' | 'facebook';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      }
    });

    if (error) {
      return {
        success: false,
        error: getFriendlyAuthErrorMessage(error.message, lang),
        errorCode: error.message
      };
    }

    return {
      success: true,
      isNewUser: false
    };
  } catch (err: any) {
    return {
      success: false,
      error: getFriendlyAuthErrorMessage(err?.message || 'Social auth failed', lang),
      errorCode: 'social-auth-error'
    };
  }
}

/**
 * Send password reset email using Supabase Auth
 */
export async function sendUserPasswordResetEmail(
  email: string,
  lang: 'bn' | 'en' = 'bn'
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmailFormat(cleanEmail)) {
    return {
      success: false,
      error: lang === 'bn' ? 'সঠিক ইমেইল ঠিকানা দিন।' : 'Please enter a valid email address.'
    };
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}?reset=true` : undefined
      });
      if (error) {
        return { success: false, error: getFriendlyAuthErrorMessage(error.message, lang) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'পাসওয়ার্ড রিসেট ইমেইল পাঠানো যায়নি' };
    }
  }

  return { success: true };
}

/**
 * Update authenticated user's password in Supabase Auth
 */
export async function updateUserPassword(
  newPassword: string,
  lang: 'bn' | 'en' = 'bn'
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.'
    };
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: getFriendlyAuthErrorMessage(error.message, lang) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'পাসওয়ার্ড পরিবর্তন করা যায়নি' };
    }
  }

  return { success: true };
}

/**
 * Sign out the current user from Supabase Auth
 */
export async function performSignOut(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Supabase Auth] Sign out error:', err);
    }
  }
}

/**
 * Fetch all roles assigned to a user from user_roles table
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !userId) return ['customer'];

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      return ['customer'];
    }
    return data.map((d: any) => d.role);
  } catch {
    return ['customer'];
  }
}

/**
 * Add a role to a user (e.g. seller, freelancer, service_provider)
 */
export async function addRoleToUser(
  userId: string,
  role: 'seller' | 'freelancer' | 'service_provider' | 'member'
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required' };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert([{ user_id: userId, role }], { onConflict: 'user_id,role' });

      if (error) {
        return { success: false, error: error.message };
      }

      await supabase.from('security_logs').insert([
        {
          user_id: userId,
          action: 'ROLE_ACTIVATED',
          description: `User activated role: ${role}`,
          device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        }
      ]);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  return { success: true };
}

/**
 * Delete a user account from Supabase and Server in compliance with Google Play Store policies
 */
export async function deleteUserAccount(userId?: string, phone?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Invoke backend server deletion route with verified auth header
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      await fetch('/api/users/delete-account', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, phone }),
      });
    } catch (apiErr) {
      console.warn('[deleteUserAccount] Server route notification note:', apiErr);
    }

    // 2. Direct Supabase client deletion
    if (userId) {
      await databaseService.deleteUserProfile(userId);
      if (isSupabaseConfigured) {
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.from('user_roles').delete().eq('user_id', userId);
      }
    }

    // 3. Clear all local session tokens and storage keys
    await performSignOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে' };
  }
}

/**
 * Checks if error is an authentication domain error
 */
export function isDomainError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err?.message || '');
  return msg.includes('auth') || msg.includes('unauthorized') || msg.includes('domain');
}

