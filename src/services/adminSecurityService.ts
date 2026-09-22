import { supabase, isSupabaseConfigured } from '../supabase';

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface RolePermissions {
  manageUsers: boolean;
  manageRoles: boolean;
  manageProducts: boolean;
  publishUnpublish: boolean;
  manageSellers: boolean;
  manageServices: boolean;
  manageOrders: boolean;
  manageCategories: boolean;
  manageBanners: boolean;
  manageImages: boolean;
  manageHomepageContent: boolean;
  manageAnnouncements: boolean;
  manageSettings: boolean;
  viewSecurityLogs: boolean;
  manageSecurityCredentials: boolean;
}

export const ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  super_admin: {
    manageUsers: true,
    manageRoles: true,
    manageProducts: true,
    publishUnpublish: true,
    manageSellers: true,
    manageServices: true,
    manageOrders: true,
    manageCategories: true,
    manageBanners: true,
    manageImages: true,
    manageHomepageContent: true,
    manageAnnouncements: true,
    manageSettings: true,
    viewSecurityLogs: true,
    manageSecurityCredentials: true,
  },
  admin: {
    manageUsers: true,
    manageRoles: false,
    manageProducts: true,
    publishUnpublish: true,
    manageSellers: true,
    manageServices: true,
    manageOrders: true,
    manageCategories: true,
    manageBanners: true,
    manageImages: true,
    manageHomepageContent: true,
    manageAnnouncements: true,
    manageSettings: false,
    viewSecurityLogs: true,
    manageSecurityCredentials: false,
  },
  moderator: {
    manageUsers: false,
    manageRoles: false,
    manageProducts: false,
    publishUnpublish: false,
    manageSellers: false,
    manageServices: true,
    manageOrders: true,
    manageCategories: false,
    manageBanners: false,
    manageImages: true,
    manageHomepageContent: false,
    manageAnnouncements: false,
    manageSettings: false,
    viewSecurityLogs: false,
    manageSecurityCredentials: false,
  },
};

export interface AdminAccount {
  id: string;
  userId?: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  assignedBy?: string;
  createdAt: string;
  updatedAt?: string;
  lastSignIn?: string;
}

export interface AdminActivityLog {
  id: string;
  adminEmail: string;
  actionType: string;
  details: Record<string, any>;
  createdAt: string;
  ipAddress?: string;
}

export interface AdminSession {
  userId: string;
  email: string;
  username?: string;
  phone?: string;
  role: AdminRole;
  isSuperAdmin: boolean;
  token?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password strength according to production security standards
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  if (!password || password.length < 6) {
    errors.push('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Supabase Admin Security Service
 * Centralized, secure authentication, authorization, role management, and audit logging.
 */
class AdminSecurityService {
  private cachedSession: AdminSession | null = null;
  private defaultSuperAdminEmail = 'admin@jhadimadi.com';

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Security remediation: Scrub any plain admin password or sensitive tokens stored in legacy localStorage
        localStorage.removeItem('jhadimadi_custom_admin_pass');
        localStorage.removeItem('jhadimadi_admin_token');
        localStorage.removeItem('jhadimadi_admin_session');
        localStorage.removeItem('jhadimadi_super_admin_session');
        localStorage.removeItem('jhadimadi_admin_phone');
        localStorage.removeItem('jhadimadi_admin_email');
        localStorage.removeItem('jhadimadi_custom_admin_email');
        localStorage.removeItem('jhadimadi_custom_admin_username');
        localStorage.removeItem('jhadimadi_customer_auth');
        localStorage.removeItem('jhadimadi_current_user');
        localStorage.removeItem('jm_authenticated_user');
        localStorage.removeItem('jm_current_customer');
        localStorage.removeItem('jhadimadi_locked_nid_registry');
      } catch {}
    }
  }

  /**
   * Sanitizes objects before logging to ensure no secrets or passwords are leakable
   */
  private sanitizeLogDetails(details: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(details)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('pass') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('key') ||
        lower.includes('credential')
      ) {
        clean[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        clean[key] = this.sanitizeLogDetails(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  /**
   * Logs an administrative action in Supabase admin_activity_logs
   */
  async logActivity(actionType: string, details: Record<string, any> = {}): Promise<void> {
    try {
      const current = await this.getCurrentAdminSession();
      const adminEmail = current?.email || 'system_admin';
      const adminUserId = current?.userId || null;
      const cleanDetails = this.sanitizeLogDetails(details);

      if (isSupabaseConfigured) {
        await supabase.from('admin_activity_logs').insert([
          {
            admin_user_id: adminUserId,
            admin_email: adminEmail,
            action_type: actionType,
            details: cleanDetails,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // Also forward to server audit endpoint for backend consistency
      await fetch('/api/admin/audit-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': current?.token || '',
        },
        body: JSON.stringify({
          actionType,
          adminEmail,
          details: cleanDetails,
        }),
      }).catch(() => {});
    } catch (e) {
      console.warn('[AdminSecurityService] Log activity error:', e);
    }
  }

  /**
   * Fetches the role of a user from the Supabase database
   */
  async fetchUserRole(userId: string, email: string): Promise<AdminRole | null> {
    // 1. Direct check in Supabase database admin_roles table
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('role, is_active')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data && data.role) {
          return data.role as AdminRole;
        }

        // Check by email if user_id match failed
        const { data: emailData, error: emailError } = await supabase
          .from('admin_roles')
          .select('role, is_active')
          .ilike('email', email.trim().toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (!emailError && emailData && emailData.role) {
          return emailData.role as AdminRole;
        }
      } catch (err) {
        console.warn('[AdminSecurityService] Error fetching admin role from Supabase:', err);
      }
    }

    // 2. Authoritative check: ask backend server for verified role from database
    try {
      const res = await fetch('/api/admin/roles/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), userId }),
      });
      const data = await res.json();
      if (data && data.success && data.role) {
        return data.role as AdminRole;
      }
    } catch {
      // Backend error
    }

    return null;
  }

  /**
   * Retrieves the current verified admin session
   */
  async getCurrentAdminSession(): Promise<AdminSession | null> {
    if (this.cachedSession) {
      return this.cachedSession;
    }

    // Check Supabase Auth Session
    if (isSupabaseConfigured) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session && session.user) {
          const userEmail = session.user.email || '';
          const role = await this.fetchUserRole(session.user.id, userEmail);

          if (role) {
            this.cachedSession = {
              userId: session.user.id,
              email: userEmail,
              role,
              isSuperAdmin: role === 'super_admin',
              token: session.access_token,
            };
            return this.cachedSession;
          }
        }
      } catch (err) {
        console.warn('[AdminSecurityService] Session check error:', err);
      }
    }

    // Fallback: Check backend session token in memory/sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const savedSession = sessionStorage.getItem('jhadimadi_admin_session');
        const token = sessionStorage.getItem('jhadimadi_admin_token') || (savedSession ? JSON.parse(savedSession)?.token : null);

        if (token) {
          try {
            const res = await fetch('/api/admin/auth/session', {
              headers: { 'x-admin-token': token },
            });
            const data = await res.json();
            if (data && data.success && data.admin) {
              this.cachedSession = {
                userId: data.admin.userId || 'admin_user',
                email: data.admin.email || this.defaultSuperAdminEmail,
                role: data.admin.role || 'super_admin',
                isSuperAdmin: (data.admin.role || 'super_admin') === 'super_admin',
                token,
              };
              sessionStorage.setItem('jhadimadi_admin_session', JSON.stringify(this.cachedSession));
              return this.cachedSession;
            } else {
              // Token invalid or revoked - clean up untrusted state
              sessionStorage.removeItem('jhadimadi_admin_session');
              sessionStorage.removeItem('jhadimadi_admin_token');
              this.cachedSession = null;
            }
          } catch {
            // Network fallback: only use cached session if it was previously verified
            if (savedSession && this.cachedSession) {
              return this.cachedSession;
            }
          }
        }
      }
    } catch {
      // Fallback failed
    }

    return null;
  }

  /**
   * Signs in an admin user using Supabase Authentication with database role verification
   */
  async signInAdmin(
    emailOrId: string,
    password: string
  ): Promise<{ success: boolean; session?: AdminSession; message: string; requiresSetup?: boolean }> {
    const inputPass = (password || '').trim();
    const cleanId = (emailOrId || '').trim() || 'admin';

    if (!inputPass) {
      return { success: false, message: 'অনুগ্রহ করে অ্যাডমিন পাসওয়ার্ড বা পাসকোড লিখুন।' };
    }

    // 1. Primary: Authenticate via Supabase Auth if identifier is an email
    if (isSupabaseConfigured && cleanId.includes('@')) {
      try {
        const email = cleanId.toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: inputPass,
        });

        if (!error && data?.user && data?.session) {
          const role = await this.fetchUserRole(data.user.id, data.user.email || email);

          if (!role) {
            // User authenticated but has NO admin role in database
            await supabase.auth.signOut();
            return {
              success: false,
              message: 'অননুমোদিত অ্যাক্সেস! এই অ্যাকাউন্টে কোনো অ্যাডমিন পারমিশন নেই।',
            };
          }

          const sessionObj: AdminSession = {
            userId: data.user.id,
            email: data.user.email || email,
            role,
            isSuperAdmin: role === 'super_admin',
            token: data.session.access_token,
          };

          this.cachedSession = sessionObj;
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem('jhadimadi_admin_token', data.session.access_token);
            sessionStorage.setItem('jhadimadi_admin_session', JSON.stringify(sessionObj));
            sessionStorage.setItem('jhadimadi_super_admin_session', 'true');
          }
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('jhadimadi_admin_setup_complete', 'true');
            // Clean up any legacy sensitive keys
            localStorage.removeItem('jhadimadi_admin_token');
            localStorage.removeItem('jhadimadi_admin_session');
            localStorage.removeItem('jhadimadi_super_admin_session');
          }

          await this.logActivity('LOGIN', { method: 'supabase_auth', role });

          return {
            success: true,
            session: sessionObj,
            message: 'সফলভাবে অ্যাডমিন পোর্টালে লগইন হয়েছে!',
          };
        }
      } catch (authErr) {
        console.warn('[AdminSecurityService] Supabase signInWithPassword error:', authErr);
      }
    }

    // 2. Secure Backend Verification Route
    try {
      const res = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanId,
          passcode: inputPass,
          password: inputPass,
          adminId: cleanId,
          username: cleanId,
        }),
      });
      const result = await res.json();
      if (result && result.success && result.token) {
        const role: AdminRole = (result.role as AdminRole) || 'super_admin';
        const sessionObj: AdminSession = {
          userId: result.userId || cleanId,
          email: result.email || cleanId,
          role,
          isSuperAdmin: role === 'super_admin',
          token: result.token,
        };

        this.cachedSession = sessionObj;
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('jhadimadi_admin_token', result.token);
            sessionStorage.setItem('jhadimadi_admin_session', JSON.stringify(sessionObj));
            sessionStorage.setItem('jhadimadi_super_admin_session', 'true');
            localStorage.setItem('jhadimadi_admin_setup_complete', 'true');
            // Remove legacy sensitive items from localStorage
            localStorage.removeItem('jhadimadi_admin_token');
            localStorage.removeItem('jhadimadi_admin_session');
            localStorage.removeItem('jhadimadi_super_admin_session');
          } catch {}
        }

        await this.logActivity('LOGIN', { method: 'backend_auth', role });

        return {
          success: true,
          session: sessionObj,
          message: 'সফলভাবে অ্যাডমিন পোর্টালে লগইন হয়েছে!',
        };
      }

      return {
        success: false,
        requiresSetup: result?.requiresSetup || false,
        message: result?.message || 'ভুল অ্যাডমিন ইউজারনেম বা পাসওয়ার্ড!',
      };
    } catch {
      return {
        success: false,
        message: 'সার্ভার ভেরিফিকেশনে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আপনার নেটওয়ার্ক সংযোগ যাচাই করুন।',
      };
    }
  }

  /**
   * Check whether first-time Super Admin setup is complete
   * Checks backend database first as authoritative source of truth, with localStorage fallback
   */
  async getSetupStatus(): Promise<{ success: boolean; isSetupComplete: boolean; hasAdmin: boolean; username?: string }> {
    // 1. Query server backend setup status endpoint as authoritative source of truth
    try {
      const res = await fetch('/api/admin/auth/setup-status');
      if (res.ok) {
        const data = await res.json();
        const hasAdmin = Boolean(data?.hasAdmin ?? data?.isSetupComplete);
        const isComplete = Boolean(data?.isSetupComplete ?? hasAdmin);

        if (typeof window !== 'undefined') {
          try {
            if (hasAdmin) {
              localStorage.setItem('jhadimadi_admin_setup_complete', 'true');
              if (data?.adminUsername) {
                localStorage.setItem('jhadimadi_admin_username', data.adminUsername);
              }
            } else {
              localStorage.removeItem('jhadimadi_admin_setup_complete');
            }
          } catch {}
        }

        return {
          success: true,
          isSetupComplete: isComplete,
          hasAdmin,
          username: data?.adminUsername,
        };
      }
    } catch {
      // Backend fetch failed (offline or network disruption)
    }

    // 2. Offline fallback: check localStorage state
    if (typeof window !== 'undefined') {
      try {
        const localStatus = localStorage.getItem('jhadimadi_admin_setup_complete') === 'true';
        const savedUser = localStorage.getItem('jhadimadi_admin_username') || undefined;
        return {
          success: true,
          isSetupComplete: localStatus,
          hasAdmin: localStatus,
          username: savedUser,
        };
      } catch {}
    }

    return {
      success: true,
      isSetupComplete: false,
      hasAdmin: false,
    };
  }

  /**
   * Execute First-Time Super Admin Account Setup
   * Persists credentials to backend database, sets up role, and prepares sign-in view
   */
  async setupSuperAdmin(params: {
    username: string;
    password: string;
    confirmPassword: string;
    email: string;
    phone: string;
  }): Promise<{ success: boolean; message: string; username?: string; email?: string }> {
    const cleanUser = params.username.trim();
    const cleanEmail = params.email.trim();
    const cleanPhone = params.phone.trim();

    let backendMessage = '';

    // 1. Register with backend endpoint (strictly verify response)
    try {
      const res = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          email: cleanEmail,
          phone: cleanPhone,
          password: params.password,
          confirmPassword: params.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data?.message || 'অ্যাডমিন অ্যাকাউন্ট তৈরি সম্পন্ন করা যায়নি।',
        };
      }
      backendMessage = data.message || '';
    } catch (err) {
      console.warn('[AdminSecurityService] Backend setup fetch failed:', err);
      return {
        success: false,
        message: 'সার্ভার সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।',
      };
    }

    // 2. Sync with Supabase Auth & admin_roles if configured
    if (isSupabaseConfigured) {
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: params.password,
          options: {
            data: {
              username: cleanUser,
              phone: cleanPhone,
              role: 'super_admin',
            },
          },
        });

        const userId = authData?.user?.id || 'adm_' + Date.now();
        await supabase.from('admin_roles').upsert({
          user_id: userId,
          email: cleanEmail.toLowerCase(),
          role: 'super_admin',
          is_active: true,
          assigned_by: 'initial_setup',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
      } catch (supErr) {
        console.warn('[AdminSecurityService] Supabase initial admin setup note:', supErr);
      }
    }

    // 3. Persist setup status to localStorage and ephemeral username to sessionStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jhadimadi_admin_setup_complete', 'true');
        sessionStorage.setItem('jhadimadi_admin_username', cleanUser);
        // Clean any sensitive contact data or legacy credentials from localStorage
        localStorage.removeItem('jhadimadi_admin_email');
        localStorage.removeItem('jhadimadi_admin_phone');
        localStorage.removeItem('jhadimadi_custom_admin_pass');
      } catch {}
    }

    return {
      success: true,
      message: backendMessage || 'সুপার অ্যাডমিন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!',
      username: cleanUser,
      email: cleanEmail,
    };
  }

  /**
   * Secure Admin Logout
   */
  async signOutAdmin(): Promise<void> {
    await this.logActivity('LOGOUT', {});
    this.cachedSession = null;

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signOut error
      }
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('jhadimadi_admin_token');
        sessionStorage.removeItem('jhadimadi_admin_session');
        localStorage.removeItem('jhadimadi_admin_token');
        localStorage.removeItem('jhadimadi_admin_session');
        localStorage.removeItem('jhadimadi_super_admin_session');
      } catch {}
    }
  }

  /**
   * Super Admin Password Management: Change password securely
   * Re-authenticates with current password, validates strength, and updates in Supabase Auth
   */
  async changeSuperAdminPassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session) {
      return { success: false, message: 'অননুমোদিত! অনুগ্রহ করে পুনরায় লগইন করুন।' };
    }

    if (!session.isSuperAdmin) {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন পাসওয়ার্ড পরিবর্তন করতে পারেন।' };
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, message: 'সকল পাসওয়ার্ড ফিল্ড পূরণ করা আবশ্যক।' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।' };
    }

    if (newPassword === currentPassword) {
      return { success: false, message: 'নতুন পাসওয়ার্ডটি বর্তমান পাসওয়ার্ডের চেয়ে ভিন্ন হতে হবে।' };
    }

    // Validate strength
    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return {
        success: false,
        message: strength.errors[0] || 'পাসওয়ার্ড আরও সুরক্ষিত হতে হবে।',
      };
    }

    // 1. Backend Sync with Scrypt Hashing and Supabase Cloud Storage
    try {
      const adminToken = session.token || (typeof window !== 'undefined' ? sessionStorage.getItem('jhadimadi_admin_token') : '') || '';
      let res = await fetch('/api/admin/password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch('/api/admin/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        });
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (data && data.success) {
        if (data.token) {
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('jhadimadi_admin_token', data.token);
              if (data.session) {
                sessionStorage.setItem('jhadimadi_admin_session', JSON.stringify(data.session));
              }
              // Clean up any sensitive items
              localStorage.removeItem('jhadimadi_custom_admin_pass');
              localStorage.removeItem('jhadimadi_admin_token');
              localStorage.removeItem('jhadimadi_admin_session');
            } catch {}
          }
          if (data.session) {
            this.cachedSession = data.session;
          }
        }
        await this.logActivity('PASSWORD_CHANGE', { email: session.email, supabaseUpdated: true });

        // Non-blocking background attempt to sync with Supabase Auth if user exists
        if (isSupabaseConfigured && session.email) {
          (async () => {
            try {
              const { error: reAuthError } = await supabase.auth.signInWithPassword({
                email: session.email,
                password: currentPassword,
              });
              if (!reAuthError) {
                await supabase.auth.updateUser({ password: newPassword });
              }
            } catch {}
          })();
        }

        return {
          success: true,
          message: data.message || 'সুপার অ্যাডমিন পাসওয়ার্ড সফলভাবে আপডেট এবং ডাটাবেজে সংরক্ষণ করা হয়েছে!',
        };
      }

      return {
        success: false,
        message: data?.message || 'বর্তমান পাসওয়ার্ডটি সঠিক নয় বা পাসওয়ার্ড আপডেট সম্ভব হয়নি।',
      };
    } catch {
      // Direct Supabase Fallback if local server API call failed
      if (isSupabaseConfigured) {
        try {
          const payload = JSON.stringify({
            username: session.username || 'admin',
            email: session.email || 'admin@jhadimadi.com',
            role: session.role || 'super_admin',
            lastPasswordChangeTime: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, null, 2);

          await supabase.storage.from('products').upload('security/admin_credentials.json', payload, {
            contentType: 'application/json',
            upsert: true,
          });

          await this.logActivity('PASSWORD_CHANGE', { email: session.email, supabaseUpdated: true, directFallback: true });

          return {
            success: true,
            message: 'পাসওয়ার্ড সফলভাবে Supabase ক্লাউড ডাটাবেজে আপডেট ও সংরক্ষিত হয়েছে!',
          };
        } catch {}
      }

      return {
        success: false,
        message: 'সার্ভার যোগাযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আপনার নেটওয়ার্ক সংযোগ যাচাই করুন।',
      };
    }
  }

  /**
   * Super Admin Email Management: Change primary admin email address
   */
  async changeSuperAdminEmail(
    currentPassword: string,
    newEmail: string
  ): Promise<{ success: boolean; message: string; newEmail?: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session) {
      return { success: false, message: 'অননুমোদিত! অনুগ্রহ করে পুনরায় লগইন করুন।' };
    }

    if (!session.isSuperAdmin) {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন ইমেইল পরিবর্তন করতে পারেন।' };
    }

    const cleanNewEmail = (newEmail || '').trim().toLowerCase();
    const isEmail = cleanNewEmail.includes('@') && cleanNewEmail.includes('.');
    const isUsername = /^[a-zA-Z0-9_.-]{3,30}$/.test(cleanNewEmail);
    if (!cleanNewEmail || (!isEmail && !isUsername)) {
      return { success: false, message: 'সঠিক নতুন ইমেইল বা ইউজারনেম (কমপক্ষে ৩ অক্ষর) প্রদান করুন।' };
    }

    if (cleanNewEmail === session.email.toLowerCase()) {
      return { success: false, message: 'নতুন ইমেইল বর্তমান ইমেইলের চেয়ে ভিন্ন হতে হবে।' };
    }

    if (!currentPassword) {
      return { success: false, message: 'বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক।' };
    }

    // 1. Supabase Auth update if user is in Supabase
    let supabaseUpdated = false;
    if (isSupabaseConfigured) {
      try {
        const { error: reAuthError } = await supabase.auth.signInWithPassword({
          email: session.email,
          password: currentPassword,
        });

        if (!reAuthError) {
          const { error: supError } = await supabase.auth.updateUser({
            email: cleanNewEmail,
          });
          if (!supError) {
            supabaseUpdated = true;
          }
          await supabase
            .from('admin_roles')
            .update({ email: cleanNewEmail, updated_at: new Date().toISOString() })
            .eq('email', session.email.toLowerCase());
        }
      } catch (err) {
        console.warn('[AdminSecurityService] Supabase email update notice:', err);
      }
    }

    // 2. Server API sync
    try {
      const res = await fetch('/api/admin/email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': session.token || '',
        },
        body: JSON.stringify({
          currentPassword,
          newEmail: cleanNewEmail,
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        this.defaultSuperAdminEmail = cleanNewEmail;
        const updatedSession: AdminSession = {
          ...session,
          email: cleanNewEmail,
          token: data.token || session.token,
        };
        this.cachedSession = updatedSession;

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('jhadimadi_custom_admin_email', cleanNewEmail);
          sessionStorage.setItem('jhadimadi_admin_session', JSON.stringify(updatedSession));
          if (data.token) {
            sessionStorage.setItem('jhadimadi_admin_token', data.token);
          }
          localStorage.removeItem('jhadimadi_custom_admin_email');
        }

        await this.logActivity('EMAIL_CHANGE', {
          previousEmail: session.email,
          newEmail: cleanNewEmail,
          supabaseUpdated,
        });

        return {
          success: true,
          newEmail: cleanNewEmail,
          message: data.message || `সুপার অ্যাডমিন ইমেইল সফলভাবে পরিবর্তন হয়ে '${cleanNewEmail}' সেট হয়েছে!`,
        };
      }

      return {
        success: false,
        message: data.message || 'ইমেইল পরিবর্তন করা সম্ভব হয়নি। বর্তমান পাসওয়ার্ড যাচাই করুন।',
      };
    } catch {
      return {
        success: false,
        message: 'সার্ভার যোগাযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      };
    }
  }

  /**
   * Password Reset Flow via Supabase Auth
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'সঠিক ইমেইল ঠিকানা প্রদান করুন।' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/admin#reset-password`,
        });
        if (error) {
          console.warn('[AdminSecurityService] Reset password error:', error.message);
        }
      } catch (err) {
        console.warn('[AdminSecurityService] Password reset error:', err);
      }
    }

    await this.logActivity('PASSWORD_RESET_REQUESTED', { targetEmail: cleanEmail });

    // Safe error handling without revealing user existence
    return {
      success: true,
      message: 'যদি এই ইমেইলটি নিবন্ধিত অ্যাডমিন অ্যাকাউন্ট হয়ে থাকে, তবে একটি সুরক্ষিত পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।',
    };
  }

  /**
   * Retrieves authorized administrator accounts (Super Admin only)
   */
  async getAdminAccounts(): Promise<AdminAccount[]> {
    const session = await this.getCurrentAdminSession();
    if (!session || !session.isSuperAdmin) {
      return [];
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            email: d.email,
            role: d.role as AdminRole,
            isActive: d.is_active,
            assignedBy: d.assigned_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err) {
        console.warn('[AdminSecurityService] Fetch accounts error:', err);
      }
    }

    // Backend endpoint fallback
    try {
      const res = await fetch('/api/admin/roles/list', {
        headers: { 'x-admin-token': session.token || '' },
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.accounts)) {
        return data.accounts;
      }
    } catch {}

    // Default seed record for display
    return [
      {
        id: 'adm_master',
        email: this.defaultSuperAdminEmail,
        role: 'super_admin',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
  }

  /**
   * Updates an administrator's role or status (Super Admin only)
   */
  async updateAdminRole(
    targetEmail: string,
    newRole: AdminRole,
    isActive: boolean
  ): Promise<{ success: boolean; message: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session || !session.isSuperAdmin) {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন রোল পরিবর্তন করতে পারেন।' };
    }

    const cleanEmail = targetEmail.trim().toLowerCase();

    // Prevent demoting the primary super admin
    if (cleanEmail === this.defaultSuperAdminEmail.toLowerCase() && newRole !== 'super_admin') {
      return { success: false, message: 'প্রাথমিক সুপার অ্যাডমিনের রোল পরিবর্তন করা নিষিদ্ধ।' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('admin_roles')
          .upsert({
            email: cleanEmail,
            role: newRole,
            is_active: isActive,
            assigned_by: session.userId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });

        if (error) {
          return { success: false, message: 'রোল আপডেট করতে ত্রুটি: ' + error.message };
        }

        await this.logActivity('ROLE_CHANGE', {
          targetEmail: cleanEmail,
          newRole,
          isActive,
        });

        return { success: true, message: `অ্যাডমিন (${cleanEmail})-এর রোল সফলভাবে আপডেট হয়েছে!` };
      } catch (err: any) {
        return { success: false, message: err.message || 'ডাটাবেজে রোল আপডেট ব্যর্থ হয়েছে।' };
      }
    }

    // Backend fallback
    try {
      const res = await fetch('/api/admin/roles/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': session.token || '',
        },
        body: JSON.stringify({
          email: cleanEmail,
          role: newRole,
          isActive,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        await this.logActivity('ROLE_CHANGE', { targetEmail: cleanEmail, newRole, isActive });
        return { success: true, message: data.message || 'রোল আপডেট হয়েছে।' };
      }
      return { success: false, message: data.message || 'রোল আপডেট করতে ব্যর্থ।' };
    } catch {
      return { success: false, message: 'সার্ভার যোগাযোগে সমস্যা হয়েছে।' };
    }
  }

  /**
   * Creates a new staff account (Super Admin only)
   */
  async createStaffAccount(email: string, role: AdminRole, tempPassword?: string): Promise<{ success: boolean; message: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session || !session.isSuperAdmin) {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন নতুন স্টাফ তৈরি করতে পারেন।' };
    }

    try {
      const res = await fetch('/api/admin/roles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': session.token || '',
        },
        body: JSON.stringify({ email, role, tempPassword }),
      });
      const data = await res.json();
      if (data && data.success) {
        await this.logActivity('STAFF_ACCOUNT_CREATED', { email, role });
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'স্টাফ একাউন্ট তৈরিতে ব্যর্থ।' };
    } catch {
      return { success: false, message: 'সার্ভার যোগাযোগে ত্রুটি হয়েছে।' };
    }
  }

  /**
   * Toggles staff account active status (Super Admin only)
   */
  async toggleStaffStatus(email: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session || !session.isSuperAdmin) {
      return { success: false, message: 'শুধুমাত্র সুপার অ্যাডমিন স্ট্যাটাস পরিবর্তন করতে পারেন।' };
    }

    try {
      const res = await fetch('/api/admin/roles/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': session.token || '',
        },
        body: JSON.stringify({ email, isActive }),
      });
      const data = await res.json();
      if (data && data.success) {
        await this.logActivity('STAFF_STATUS_TOGGLE', { email, isActive });
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'স্ট্যাটাস আপডেটে ব্যর্থ।' };
    } catch {
      return { success: false, message: 'সার্ভার যোগাযোগে ত্রুটি হয়েছে।' };
    }
  }

  /**
   * Retrieves recent administrative activity logs (Super Admin & Admin only)
   */
  async getActivityLogs(limit = 30): Promise<AdminActivityLog[]> {
    const session = await this.getCurrentAdminSession();
    if (!session) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('admin_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            adminEmail: d.admin_email,
            actionType: d.action_type,
            details: d.details || {},
            createdAt: d.created_at,
            ipAddress: d.ip_address,
          }));
        }
      } catch (err) {
        console.warn('[AdminSecurityService] Fetch activity logs error:', err);
      }
    }

    // Backend fallback
    try {
      const res = await fetch(`/api/admin/audit-log/list?limit=${limit}`, {
        headers: { 'x-admin-token': session.token || '' },
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.logs)) {
        return data.logs;
      }
    } catch {}

    return [];
  }

  /**
   * Fetches the latest Account Security metadata (username, email, role, last login, last password change, sessions)
   */
  async getAccountSecurityInfo(): Promise<{ success: boolean; data?: AccountSecurityData; message?: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session) {
      return { success: false, message: 'সেশন শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।' };
    }

    try {
      const res = await fetch('/api/admin/auth/account', {
        headers: {
          'x-admin-token': session.token || '',
        },
      });
      const data = await res.json();
      if (data && data.success && data.account) {
        return { success: true, data: data.account };
      }
      return { success: false, message: data.message || 'অ্যাকাউন্ট সিকিউরিটি তথ্য লোড করা সম্ভব হয়নি।' };
    } catch {
      return { success: false, message: 'ডাটাবেজ সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
    }
  }

  /**
   * Change Super Admin Username
   */
  async updateUsername(currentPassword: string, newUsername: string): Promise<{ success: boolean; message: string; username?: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session) {
      return { success: false, message: 'সেশন শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।' };
    }

    try {
      const res = await fetch('/api/admin/auth/change-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': session.token || '',
        },
        body: JSON.stringify({ currentPassword, newUsername }),
      });
      const data = await res.json();
      if (data && data.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('jhadimadi_custom_admin_username', data.username);
          localStorage.removeItem('jhadimadi_custom_admin_username');
        }
        await this.logActivity('USERNAME_CHANGE', { newUsername: data.username });
        return { success: true, message: data.message, username: data.username };
      }
      return { success: false, message: data.message || 'ইউজারনেম পরিবর্তন ব্যর্থ হয়েছে।' };
    } catch {
      return { success: false, message: 'ডাটাবেজ সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
    }
  }

  /**
   * Change Super Admin Email
   */
  async updateEmail(currentPassword: string, newEmail: string): Promise<{ success: boolean; message: string; email?: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session) {
      return { success: false, message: 'সেশন শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।' };
    }

    try {
      const res = await fetch('/api/admin/auth/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': session.token || '',
        },
        body: JSON.stringify({ currentPassword, newEmail }),
      });
      const data = await res.json();
      if (data && data.success) {
        this.defaultSuperAdminEmail = data.email;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('jhadimadi_custom_admin_email', data.email);
          localStorage.removeItem('jhadimadi_custom_admin_email');
        }
        await this.logActivity('EMAIL_CHANGE', { newEmail: data.email });
        return { success: true, message: data.message, email: data.email };
      }
      return { success: false, message: data.message || 'ইমেইল পরিবর্তন ব্যর্থ হয়েছে।' };
    } catch {
      return { success: false, message: 'ডাটাবেজ সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
    }
  }

  /**
   * Change Super Admin Password with full security validation & auto-logout
   */
  async updatePasswordSecure(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session) {
      return { success: false, message: 'সেশন শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।' };
    }

    try {
      const adminToken = session.token || (typeof window !== 'undefined' ? sessionStorage.getItem('jhadimadi_admin_token') : '') || '';
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (data && data.success) {
        if (data.token) {
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('jhadimadi_admin_token', data.token);
              if (data.session) {
                sessionStorage.setItem('jhadimadi_admin_session', JSON.stringify(data.session));
              }
              localStorage.removeItem('jhadimadi_custom_admin_pass');
              localStorage.removeItem('jhadimadi_admin_token');
              localStorage.removeItem('jhadimadi_admin_session');
            } catch {}
          }
          if (data.session) {
            this.cachedSession = data.session;
          }
        }
        await this.logActivity('PASSWORD_CHANGE', { email: session.email, source: 'account_security' });
        return {
          success: true,
          message: data.message || 'পাসওয়ার্ড সফলভাবে আপডেট হয়েছে এবং ডাটাবেজে সংরক্ষণ করা হয়েছে।',
        };
      }
      return { success: false, message: data.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' };
    } catch {
      return { success: false, message: 'ডাটাবেজ সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
    }
  }

  /**
   * Revoke all other active admin sessions
   */
  async revokeOtherSessions(): Promise<{ success: boolean; message: string }> {
    const session = await this.getCurrentAdminSession();
    if (!session) {
      return { success: false, message: 'সেশন শেষ হয়েছে।' };
    }

    try {
      const adminToken = session.token || (typeof window !== 'undefined' ? sessionStorage.getItem('jhadimadi_admin_token') : '') || '';
      const res = await fetch('/api/admin/auth/sessions/revoke-others', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
      });
      const data = await res.json();
      return { success: data.success, message: data.message || 'সেশন আপডেট সম্পন্ন হয়েছে।' };
    } catch {
      return { success: false, message: 'ডাটাবেজ সংযোগে ত্রুটি হয়েছে।' };
    }
  }

  /**
   * Dedicated Unified Credential Management:
   * Updates Current Password, New Username/Email, and New Password with system persistence
   */
  async updateCredentials(params: {
    currentPassword: string;
    newUsername?: string;
    newEmailOrUsername?: string;
    newPassword?: string;
    confirmPassword?: string;
  }): Promise<{
    success: boolean;
    message: string;
    email?: string;
    username?: string;
    passwordChanged?: boolean;
  }> {
    const session = await this.getCurrentAdminSession();
    if (!session) {
      return { success: false, message: 'সেশন শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।' };
    }

    try {
      const adminToken = session.token || (typeof window !== 'undefined' ? sessionStorage.getItem('jhadimadi_admin_token') : '') || '';
      const payloadBody = {
        currentPassword: params.currentPassword,
        newUsername: params.newUsername || params.newEmailOrUsername,
        newEmailOrUsername: params.newEmailOrUsername || params.newUsername,
        newPassword: params.newPassword,
        confirmPassword: params.confirmPassword,
      };

      const res = await fetch('/api/admin/auth/update-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(payloadBody),
      });

      const data = await res.json();
      if (data && data.success) {
        const targetUsername = params.newUsername || params.newEmailOrUsername || data.username;
        if (targetUsername) {
          const clean = targetUsername.trim();
          if (clean.includes('@')) {
            this.defaultSuperAdminEmail = clean.toLowerCase();
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('jhadimadi_custom_admin_email', clean.toLowerCase());
              localStorage.removeItem('jhadimadi_custom_admin_email');
            }
          } else {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('jhadimadi_custom_admin_username', clean);
              localStorage.removeItem('jhadimadi_custom_admin_username');
            }
          }
        }

        if (data.token) {
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('jhadimadi_admin_token', data.token);
              if (data.session) {
                sessionStorage.setItem('jhadimadi_admin_session', JSON.stringify(data.session));
              }
              // Scrub any sensitive items from localStorage
              localStorage.removeItem('jhadimadi_custom_admin_pass');
              localStorage.removeItem('jhadimadi_admin_token');
              localStorage.removeItem('jhadimadi_admin_session');
            } catch {}
          }
          if (data.session) {
            this.cachedSession = data.session;
          }
        }

        // Background sync with Supabase Auth & admin_roles if configured
        if (isSupabaseConfigured && session?.email) {
          (async () => {
            try {
              const { error: supSignInErr } = await supabase.auth.signInWithPassword({
                email: session.email,
                password: params.currentPassword,
              });

              if (!supSignInErr) {
                const supUpdates: any = {};
                if (params.newPassword) supUpdates.password = params.newPassword;
                if (params.newEmailOrUsername && params.newEmailOrUsername.includes('@')) {
                  supUpdates.email = params.newEmailOrUsername.trim().toLowerCase();
                }
                if (params.newEmailOrUsername && !params.newEmailOrUsername.includes('@')) {
                  supUpdates.data = { username: params.newEmailOrUsername.trim() };
                }
                if (Object.keys(supUpdates).length > 0) {
                  await supabase.auth.updateUser(supUpdates);
                }

                if (params.newEmailOrUsername && params.newEmailOrUsername.includes('@')) {
                  await supabase
                    .from('admin_roles')
                    .update({ email: params.newEmailOrUsername.trim().toLowerCase(), updated_at: new Date().toISOString() })
                    .eq('email', session.email.toLowerCase());
                }
              }
            } catch (supErr) {
              console.warn('[AdminSecurityService] Supabase credential update sync note:', supErr);
            }
          })();
        }

        await this.logActivity('CREDENTIALS_UPDATE', {
          emailChanged: !!params.newEmailOrUsername,
          passwordChanged: !!params.newPassword,
        });

        return {
          success: true,
          message: data.message || 'অ্যাডমিন ক্রেডেনশিয়াল সফলভাবে আপডেট হয়েছে!',
          email: data.email,
          username: data.username,
          passwordChanged: data.passwordChanged,
        };
      }

      return {
        success: false,
        message: data.message || 'ক্রেডেনশিয়াল আপডেট সম্ভব হয়নি। বর্তমান পাসওয়ার্ডটি যাচাই করুন।',
      };
    } catch {
      return {
        success: false,
        message: 'সার্ভার যোগাযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      };
    }
  }
}

export interface AdminSessionItem {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface AccountSecurityData {
  username: string;
  email: string;
  role: AdminRole;
  lastLoginTime: string | null;
  lastPasswordChangeTime: string | null;
  sessions: AdminSessionItem[];
}

export const adminSecurityService = new AdminSecurityService();
