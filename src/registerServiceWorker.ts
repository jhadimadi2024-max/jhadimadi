/**
 * Service Worker Registration for Jhadimadi.com
 * Provides native app-like caching and offline fallback capabilities in production
 * Completely bypassed during dev & iframe preview to ensure instant UI synchronization
 */

export function registerServiceWorker(onUpdate?: () => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // In development mode, preview mode, or iframe preview, unregister service workers
  // and clear all CacheStorage to prevent serving stale static UI assets
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isDevHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.run.app') ||
    window.location.hostname.includes('webcontainer') ||
    window.location.search.includes('bypass-sw=true') ||
    window.location.search.includes('dev=true') ||
    window.location.search.includes('preview=true')
  );
  const isDev = Boolean(import.meta.env.DEV || isIframe || isDevHost);

  if (isDev) {
    // Unregister all existing service workers
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});

    // Clear any stale browser CacheStorage
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name).catch(() => {});
        }
      }).catch(() => {});
    }
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                if (onUpdate) onUpdate();
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[Jhadimadi SW] Service worker registration failed:', error);
      });
  });
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      })
      .catch(() => {});
  }
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name).catch(() => {});
      }
    }).catch(() => {});
  }
}
