// Jhadimadi.com Service Worker (sw.js)
// Enables native app-like offline caching in production while completely bypassing caching in dev/preview

const CACHE_NAME = 'jhadimadi-v3.3-cache';

// Detect development, cloud run preview, localhost, or iframe testing environments
const isDevOrPreview = 
  typeof self !== 'undefined' && (
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1' ||
    self.location.hostname.includes('.run.app') ||
    self.location.hostname.includes('webcontainer') ||
    self.location.search.includes('bypass-sw=true') ||
    self.location.search.includes('dev=true') ||
    self.location.search.includes('preview=true')
  );

if (isDevOrPreview) {
  // In development & preview mode, immediately bypass, purge all caches, and self-unregister
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', () => {
    // Return early to let browser handle native network requests directly without interception
    return;
  });
} else {
  // Production Caching Strategy for Installed PWA / Custom Production Domain
  const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo.png',
    '/runner-logo.png',
    '/runner-logo-hires.png',
    '/runner-fixed.png',
    '/assets/images/logo.png',
    '/assets/images/runner-logo.png',
    '/favicon.ico'
  ];

  // 1. Install event: Pre-cache core shell
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        await Promise.allSettled(
          STATIC_ASSETS.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response);
              }
            } catch (e) {
              // Ignore optional file errors during install
            }
          })
        );
      }).then(() => self.skipWaiting())
    );
  });

  // 2. Activate event: Clean up old caches & take control immediately
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }).then(() => self.clients.claim())
    );
  });

  // 3. Fetch event: Network-First fallback to Cache strategy for SPA
  self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Ignore non-GET requests or non-HTTP/HTTPS URLs
    if (request.method !== 'GET' || !request.url.startsWith('http')) {
      return;
    }

    // Bypass API requests, Vite HMR, and development tooling
    try {
      const url = new URL(request.url);
      if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/@vite/') ||
        url.pathname.startsWith('/@fs/') ||
        url.pathname.startsWith('/src/') ||
        url.pathname.includes('node_modules') ||
        url.search.includes('?import') ||
        url.search.includes('&import') ||
        url.search.includes('?t=')
      ) {
        return;
      }
    } catch (e) {
      // URL parsing fallback
    }

    // A. Navigation / HTML Document requests (Network-First)
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            return networkResponse;
          })
          .catch(async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(request);
            if (cachedResponse) return cachedResponse;
            const cachedIndex = await cache.match('/index.html') || await cache.match('/');
            if (cachedIndex) return cachedIndex;

            return new Response(
              `<!DOCTYPE html>
              <html lang="bn">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - Jhadimadi.com</title>
                <style>
                  body { font-family: sans-serif; background: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; color: #1f2937; }
                  .card { background: white; border-radius: 16px; padding: 32px 24px; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
                  h1 { font-size: 20px; font-weight: 800; color: #16a34a; margin-top: 0; }
                  p { font-size: 14px; color: #4b5563; line-height: 1.6; }
                  button { background: #16a34a; color: white; border: none; padding: 12px 24px; border-radius: 9999px; font-weight: bold; cursor: pointer; margin-top: 16px; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>ইন্টারনেট সংযোগ নেই (Offline)</h1>
                  <p>আপনার ডিভাইসটি বর্তমানে অফলাইনে আছে। অনুগ্রহ করে আপনার ওয়াইফাই বা মোবাইল ডাটা সংযোগ পরীক্ষা করুন।</p>
                  <button onclick="window.location.reload()">পুনরায় চেষ্টা করুন (Retry)</button>
                </div>
              </body>
              </html>`,
              {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
                status: 200,
                statusText: 'OK',
              }
            );
          })
      );
      return;
    }

    // B. Static Assets, Scripts, Stylesheets, Images, Fonts:
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#334155"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="12">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          return new Response('Network error and not found in cache', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        })
    );
  });
}
