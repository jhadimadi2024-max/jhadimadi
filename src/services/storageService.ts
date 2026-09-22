/**
 * Enterprise Safe Storage Service & Security Sanitizer
 * 
 * Strict Storage Policy:
 * 1. localStorage is strictly reserved for non-sensitive UI preferences (theme, language, shopping cart state).
 * 2. Raw passwords, auth tokens, admin credentials, and sensitive personal identity data
 *    are STRICTLY FORBIDDEN from localStorage.
 * 3. Ephemeral sessions and security tokens must use sessionStorage or in-memory state.
 */

// Explicitly banned keys and patterns for localStorage
const SENSITIVE_STORAGE_KEYS = [
  'jhadimadi_custom_admin_pass',
  'jhadimadi_admin_token',
  'jhadimadi_admin_session',
  'jhadimadi_super_admin_session',
  'jhadimadi_admin_phone',
  'jhadimadi_admin_email',
  'jhadimadi_custom_admin_username',
  'jhadimadi_custom_admin_email',
  'jhadimadi_customer_auth',
  'jhadimadi_current_user',
  'jm_authenticated_user',
  'jm_current_customer',
  'jhadimadi_locked_nid_registry',
  'jhadimadi_offline_user_v1',
  'jhadimadi_offline_pro_profile_v1',
];

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /credential/i,
  /nid_registry/i,
  /auth_user/i,
  /admin_session/i,
];

/**
 * Actively audits and purges any sensitive data, tokens, or credentials from browser localStorage
 */
export function sanitizeLocalStorage(): void {
  try {
    if (typeof window === 'undefined') return;
    const storage = window.localStorage;
    if (!storage) return;

    // 1. Remove explicit known sensitive keys
    for (const key of SENSITIVE_STORAGE_KEYS) {
      try {
        if (storage.getItem(key) !== null) {
          storage.removeItem(key);
        }
      } catch {}
    }

    // 2. Scan all existing localStorage keys for any sensitive patterns
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      try {
        const key = storage.key(i);
        if (!key) continue;

        // Check if key matches sensitive patterns
        const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
        if (isSensitiveKey) {
          keysToRemove.push(key);
          continue;
        }

        // Check if stored value accidentally contains raw password or auth token JSON
        const value = storage.getItem(key);
        if (value && typeof value === 'string') {
          const lower = value.toLowerCase();
          if (
            (lower.includes('"password":') || lower.includes('"passwordhash":') || lower.includes('"access_token":')) &&
            !key.includes('cart') &&
            !key.includes('language') &&
            !key.includes('theme')
          ) {
            keysToRemove.push(key);
          }
        }
      } catch {}
    }

    for (const key of keysToRemove) {
      try {
        storage.removeItem(key);
      } catch {}
    }
  } catch (err) {
    console.warn('[StorageSanitizer] Note during localStorage audit:', err);
  }
}

// Automatically sanitize on load
if (typeof window !== 'undefined') {
  sanitizeLocalStorage();
}

class SafeStorageService {
  private memoryCache: Map<string, string> = new Map();

  private isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getItem<T>(key: string, defaultValue: T, type: 'localStorage' | 'sessionStorage' = 'localStorage'): T {
    try {
      if (this.isStorageAvailable(type)) {
        const item = window[type].getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
      } else {
        const cached = this.memoryCache.get(`${type}:${key}`);
        if (!cached) return defaultValue;
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      console.warn(`[StorageService] Failed to read key "${key}":`, err);
      return defaultValue;
    }
  }

  public setItem<T>(key: string, value: T, type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean {
    try {
      // Security Enforcement: Block sensitive data from localStorage
      if (type === 'localStorage') {
        const isForbidden = SENSITIVE_STORAGE_KEYS.includes(key) || SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(key));
        if (isForbidden) {
          // Never persist raw passwords anywhere
          if (/pass/i.test(key)) {
            console.warn(`[Security Policy] Blocked attempt to store credentials/passwords in localStorage for key "${key}".`);
            return false;
          }
          // Redirect other session/token state to sessionStorage
          console.warn(`[Security Policy] Redirecting sensitive storage key "${key}" from localStorage to sessionStorage.`);
          return this.setItem(key, value, 'sessionStorage');
        }
      }

      const serialized = JSON.stringify(value);
      if (this.isStorageAvailable(type)) {
        window[type].setItem(key, serialized);
      }
      this.memoryCache.set(`${type}:${key}`, serialized);
      return true;
    } catch (err) {
      console.warn(`[StorageService] Failed to write key "${key}":`, err);
      this.memoryCache.set(`${type}:${key}`, JSON.stringify(value));
      return false;
    }
  }

  public removeItem(key: string, type: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
    try {
      if (this.isStorageAvailable(type)) {
        window[type].removeItem(key);
      }
      this.memoryCache.delete(`${type}:${key}`);
    } catch (err) {
      console.warn(`[StorageService] Failed to remove key "${key}":`, err);
    }
  }

  public clear(type: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
    try {
      if (this.isStorageAvailable(type)) {
        window[type].clear();
      }
      this.memoryCache.clear();
    } catch (err) {
      console.warn(`[StorageService] Failed to clear storage:`, err);
    }
  }
}

export const safeStorage = new SafeStorageService();
export default safeStorage;

