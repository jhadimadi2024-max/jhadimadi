/**
 * Offline Storage Management for Jhadimadi.com
 * 
 * Strict Storage Partitioning & Universal Sandbox Safety:
 * - localStorage: strictly reserved for non-sensitive UI preferences (cart, language, public catalog cache).
 * - sessionStorage: used for ephemeral user/profile session data during an active browsing tab.
 * - In-memory fallback: transparent fallback when localStorage/sessionStorage is blocked, restricted, or throws SecurityError.
 * - Sensitive user profiles and credentials are systematically purged from persistent localStorage.
 */

export const OFFLINE_KEYS = {
  CART: 'jhadimadi_offline_cart_v1',
  PRODUCTS: 'jhadimadi_offline_products_v1',
  POSTS: 'jhadimadi_offline_posts_v1',
  PROFESSIONALS: 'jhadimadi_offline_professionals_v1',
  USER: 'jhadimadi_session_user_v1',
  PRO_PROFILE: 'jhadimadi_session_pro_profile_v1',
  CACHED_AT: 'jhadimadi_offline_timestamp_v1',
};

// Legacy keys that must never remain in localStorage
const LEGACY_SENSITIVE_LOCAL_KEYS = [
  'jhadimadi_offline_user_v1',
  'jhadimadi_offline_pro_profile_v1',
  'jhadimadi_customer_auth',
  'jhadimadi_current_user',
  'jm_authenticated_user',
  'jhadimadi_admin_blood_donors_v1',
  'jhadimadi_admin_blood_donors_v2',
];

// Helper to determine if a key is sensitive session data
const isSessionOnlyKey = (key: string): boolean => {
  return (
    key === OFFLINE_KEYS.USER ||
    key === OFFLINE_KEYS.PRO_PROFILE ||
    key.includes('session_user') ||
    key.includes('user_v1')
  );
};

// Universal safe storage accessor with memory cache fallback
const inMemoryStore = new Map<string, string>();

const getSafeStorage = (type: 'localStorage' | 'sessionStorage'): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
    const storage = (window as any)[type];
    if (!storage) return null;
    const testKey = '__jhadimadi_test_store__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
};

// Clean up any legacy sensitive data safely on initialization
try {
  const local = getSafeStorage('localStorage');
  if (local) {
    for (const k of LEGACY_SENSITIVE_LOCAL_KEYS) {
      try {
        local.removeItem(k);
      } catch {}
    }
  }
} catch {}

export const offlineStorage = {
  saveItem: <T>(key: string, data: T): void => {
    try {
      // Sanitize data to strip any password fields if present
      let sanitizedData = data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const copy: any = { ...data };
        if ('password' in copy) delete copy.password;
        if ('passwordHash' in copy) delete copy.passwordHash;
        sanitizedData = copy;
      }

      const serialized = JSON.stringify(sanitizedData);

      // Route sensitive user data to sessionStorage only
      if (isSessionOnlyKey(key)) {
        const session = getSafeStorage('sessionStorage');
        if (session) {
          try {
            session.setItem(key, serialized);
          } catch {}
        }
        inMemoryStore.set(`session:${key}`, serialized);

        // Ensure it is purged from localStorage
        const local = getSafeStorage('localStorage');
        if (local) {
          try {
            local.removeItem(key);
          } catch {}
        }
        inMemoryStore.delete(`local:${key}`);
        return;
      }

      // Non-sensitive UI data (cart, products, posts) in localStorage
      const local = getSafeStorage('localStorage');
      if (local) {
        try {
          local.setItem(key, serialized);
          local.setItem(OFFLINE_KEYS.CACHED_AT, new Date().toISOString());
        } catch {}
      }
      inMemoryStore.set(`local:${key}`, serialized);
      inMemoryStore.set(`local:${OFFLINE_KEYS.CACHED_AT}`, new Date().toISOString());
    } catch (e) {
      console.warn('[Offline Storage] Failed to save item:', key, e);
    }
  },

  removeItem: (key: string): void => {
    try {
      const session = getSafeStorage('sessionStorage');
      if (session) {
        try {
          session.removeItem(key);
        } catch {}
      }
      const local = getSafeStorage('localStorage');
      if (local) {
        try {
          local.removeItem(key);
        } catch {}
      }
      inMemoryStore.delete(`session:${key}`);
      inMemoryStore.delete(`local:${key}`);
    } catch (e) {
      console.warn('[Offline Storage] Failed to remove item:', key, e);
    }
  },

  getItem: <T>(key: string, fallback: T): T => {
    try {
      // Sensitive user data is read from sessionStorage only
      if (isSessionOnlyKey(key)) {
        const session = getSafeStorage('sessionStorage');
        if (session) {
          try {
            const sessionItem = session.getItem(key);
            if (sessionItem) {
              return JSON.parse(sessionItem) as T;
            }
          } catch {}
        }
        // Fallback to in-memory store
        const memItem = inMemoryStore.get(`session:${key}`);
        if (memItem) {
          try {
            return JSON.parse(memItem) as T;
          } catch {}
        }

        // Also check if legacy existed in localStorage, read it once, migrate to sessionStorage and delete from localStorage
        const local = getSafeStorage('localStorage');
        if (local) {
          try {
            const legacyItem = local.getItem(key);
            if (legacyItem) {
              local.removeItem(key);
              const parsed = JSON.parse(legacyItem) as T;
              if (session) {
                try {
                  session.setItem(key, JSON.stringify(parsed));
                } catch {}
              }
              inMemoryStore.set(`session:${key}`, JSON.stringify(parsed));
              return parsed;
            }
          } catch {}
        }
        return fallback;
      }

      // Non-sensitive storage
      const local = getSafeStorage('localStorage');
      if (local) {
        try {
          const item = local.getItem(key);
          if (item) {
            return JSON.parse(item) as T;
          }
        } catch {}
      }
      // Fallback to in-memory store
      const memLocal = inMemoryStore.get(`local:${key}`);
      if (memLocal) {
        try {
          return JSON.parse(memLocal) as T;
        } catch {}
      }
    } catch (e) {
      console.warn('[Offline Storage] Failed to parse item:', key, e);
    }
    return fallback;
  },

  getLastCachedTime: (): string | null => {
    try {
      const local = getSafeStorage('localStorage');
      if (local) {
        try {
          const val = local.getItem(OFFLINE_KEYS.CACHED_AT);
          if (val) return val;
        } catch {}
      }
      return inMemoryStore.get(`local:${OFFLINE_KEYS.CACHED_AT}`) || null;
    } catch {
      return null;
    }
  },

  clearAllOfflineData: (): void => {
    try {
      const local = getSafeStorage('localStorage');
      if (local) {
        try {
          Object.values(OFFLINE_KEYS).forEach((k) => local.removeItem(k));
          LEGACY_SENSITIVE_LOCAL_KEYS.forEach((k) => local.removeItem(k));
        } catch {}
      }
      const session = getSafeStorage('sessionStorage');
      if (session) {
        try {
          session.removeItem(OFFLINE_KEYS.USER);
          session.removeItem(OFFLINE_KEYS.PRO_PROFILE);
        } catch {}
      }
      inMemoryStore.clear();
    } catch (e) {
      console.warn('[Offline Storage] Failed to clear offline data:', e);
    }
  },
};

