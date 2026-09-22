/**
 * Secure Admin Password Management for Jhadimadi.com
 * Integrated with Supabase Authentication and RBAC
 */
import { adminSecurityService } from '../services/adminSecurityService';

const ADMIN_PASS_UPDATED_AT_KEY = 'jhadimadi_admin_pass_updated_at_v2';

export const adminAuthService = {
  /**
   * Updates admin password via secure Supabase / Backend integration
   */
  updatePermanentPassword: async (
    newPassword: string,
    currentPassword?: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await adminSecurityService.changeSuperAdminPassword(
        currentPassword || '',
        newPassword,
        confirmPassword || newPassword
      );
      if (res.success && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ADMIN_PASS_UPDATED_AT_KEY, new Date().toISOString());
      }
      return res;
    } catch {
      return {
        success: false,
        message: 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।',
      };
    }
  },

  /**
   * Verifies credentials against backend admin authentication endpoint and Supabase Auth
   */
  verifyWithBackend: async (
    inputPassword: string,
    adminId?: string
  ): Promise<{ success: boolean; token?: string; role?: string; message?: string }> => {
    if (!inputPassword) return { success: false, message: 'পাসওয়ার্ড প্রদান করুন।' };
    try {
      const res = await adminSecurityService.signInAdmin(adminId || 'superadmin', inputPassword);
      if (res.success && res.session) {
        return {
          success: true,
          token: res.session.token,
          role: res.session.role,
        };
      }
      return {
        success: false,
        message: res.message || 'ভুল অ্যাডমিন ক্রেডেনশিয়াল!',
      };
    } catch {
      return {
        success: false,
        message: 'লগইন যাচাইকরণে ত্রুটি হয়েছে।',
      };
    }
  },

  /**
   * Retrieves active admin authentication token
   */
  getAdminToken: (): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem('jhadimadi_admin_token');
      }
    } catch {
      return null;
    }
    return null;
  },

  /**
   * Returns when the password was last updated
   */
  getLastUpdatedAt: (): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(ADMIN_PASS_UPDATED_AT_KEY);
      }
    } catch {
      return null;
    }
    return null;
  },
};
