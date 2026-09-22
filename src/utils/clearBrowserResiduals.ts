/**
 * Programmatic Browser Cache & Storage Cleanup Utility
 * Clears stale tokens, corrupted auth sessions, and stale CacheStorage
 * to guarantee that Supabase initializes without residual token conflicts.
 */

export function clearBrowserResidualStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Purge stale Supabase auth tokens and cached session keys from localStorage
    if (window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;

        const lowerKey = key.toLowerCase();
        // Target Supabase session keys, auth tokens, and stale API credential caches
        if (
          lowerKey.startsWith('sb-') ||
          lowerKey.includes('supabase') ||
          lowerKey.includes('auth-token') ||
          lowerKey.includes('auth_token') ||
          lowerKey.includes('gotrue')
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch (_) {}
      });
    }

    // 2. Purge sessionStorage residual auth data
    if (window.sessionStorage) {
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (!key) continue;

        const lowerKey = key.toLowerCase();
        if (
          lowerKey.startsWith('sb-') ||
          lowerKey.includes('supabase') ||
          lowerKey.includes('auth')
        ) {
          sessionKeysToRemove.push(key);
        }
      }

      sessionKeysToRemove.forEach((key) => {
        try {
          window.sessionStorage.removeItem(key);
        } catch (_) {}
      });
    }

    // 3. Clear Service Worker & Browser CacheStorage
    if ('caches' in window && window.caches) {
      window.caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          try {
            window.caches.delete(cacheName);
          } catch (_) {}
        });
      }).catch(() => {});
    }

    // 4. Clean IndexedDB Supabase Databases if any exist
    if ('indexedDB' in window && window.indexedDB && window.indexedDB.databases) {
      window.indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          if (db.name && (db.name.includes('supabase') || db.name.startsWith('sb-'))) {
            try {
              window.indexedDB.deleteDatabase(db.name);
            } catch (_) {}
          }
        });
      }).catch(() => {});
    }

    console.info('[Supabase Init] Programmatic cache & residual auth storage cleared successfully.');
  } catch (err) {
    console.warn('[Supabase Init] Non-blocking notice during storage cleanup:', err);
  }
}
