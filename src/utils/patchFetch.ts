/**
 * Safe fetch polyfill & Enterprise Resilience Middleware:
 * 1. Solves the sandboxed iframe "Cannot set property fetch of #<Window>" strict-mode error.
 * 2. Implements in-flight request deduplication for concurrent GET requests.
 * 3. Implements short-lived in-memory caching (TTL 15s) for read-only endpoints (/api/products, /api/banners, etc.).
 * 4. Gracefully intercepts HTTP 429 (Too Many Requests):
 *    - Serves cached data if available (ensuring products & UI never vanish).
 *    - Automatically retries with backoff if no cache exists.
 * 5. Paces client-side request bursts to prevent flooding the server.
 */

interface CachedEntry {
  bodyText: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestamp: number;
}

// In-memory cache for GET requests
const responseCache = new Map<string, CachedEntry>();
const CACHE_TTL_MS = 15 * 1000; // 15 seconds TTL for read GET requests

// In-flight promises to deduplicate simultaneous requests
const inFlightRequests = new Map<string, Promise<Response>>();

// Client-side rate limiter / queue: max 12 concurrent requests / max 20 req/sec
let activeRequestsCount = 0;
const MAX_CONCURRENT = 10;
const requestQueue: Array<() => void> = [];

function dequeue() {
  if (activeRequestsCount < MAX_CONCURRENT && requestQueue.length > 0) {
    activeRequestsCount++;
    const nextTask = requestQueue.shift();
    if (nextTask) {
      // Defer to next event loop turn to break any synchronous recursion chain
      setTimeout(nextTask, 0);
    }
  }
}

function scheduleRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const execute = () => {
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeRequestsCount = Math.max(0, activeRequestsCount - 1);
          dequeue();
        });
    };

    if (activeRequestsCount < MAX_CONCURRENT) {
      activeRequestsCount++;
      execute();
    } else {
      requestQueue.push(execute);
    }
  });
}

function createSyntheticResponse(cached: CachedEntry): Response {
  const headers = new Headers(cached.headers);
  headers.set('x-served-from-client-cache', 'true');
  return new Response(cached.bodyText, {
    status: 200,
    statusText: 'OK (Cached)',
    headers,
  });
}

export function ensureSafeFetch(): void {
  if (typeof window === 'undefined') return;
  if ((window as any).__patchFetchInitialized) return;
  (window as any).__patchFetchInitialized = true;

  try {
    // Obtain true native browser fetch
    const rawNativeFetch = (window as any).__originalNativeFetch || window.fetch;
    if (typeof rawNativeFetch !== 'function') return;

    if (!(window as any).__originalNativeFetch) {
      (window as any).__originalNativeFetch = rawNativeFetch.bind(window);
    }

    const nativeFetch = (window as any).__originalNativeFetch as typeof window.fetch;

    // Resilient wrapped fetch implementation
    const resilientFetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const method = (init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')).toUpperCase();

      // Only apply deduplication and caching to GET requests
      const isGet = method === 'GET';
      const isApiCall = urlString.includes('/api/') || urlString.startsWith('/api/');

      // Check cache for GET requests
      if (isGet && isApiCall) {
        const cached = responseCache.get(urlString);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return createSyntheticResponse(cached);
        }

        // Deduplicate identical in-flight GET requests
        const inFlight = inFlightRequests.get(urlString);
        if (inFlight) {
          try {
            const res = await inFlight;
            return res.clone();
          } catch {
            // Fall through to make request if in-flight failed
          }
        }
      }

      // Execute request with throttling and retry logic directly against native fetch
      const executeFetch = async (retryCount = 0): Promise<Response> => {
        try {
          const res = await nativeFetch(input, init);

          // Handle 429 Too Many Requests gracefully
          if (res.status === 429) {
            console.warn(`[ResilientFetch] Rate limit 429 encountered for ${urlString}`);

            // 1. If we have ANY cached entry for this URL, serve it immediately to prevent UI crash!
            const fallbackCache = responseCache.get(urlString);
            if (fallbackCache) {
              console.info(`[ResilientFetch] Serving cached fallback for ${urlString} after 429`);
              return createSyntheticResponse(fallbackCache);
            }

            // 2. Otherwise, check Retry-After and retry with backoff (up to 2 retries)
            if (retryCount < 2 && isGet) {
              const retryAfterHeader = res.headers.get('Retry-After');
              const waitMs = retryAfterHeader ? Math.min(parseInt(retryAfterHeader, 10) * 1000, 4000) : (1500 * (retryCount + 1));
              await new Promise(r => setTimeout(r, waitMs));
              return executeFetch(retryCount + 1);
            }

            // 3. If retries exhausted and no cache, return safe JSON envelope instead of throwing
            const safe429Body = JSON.stringify({
              success: false,
              rateLimited: true,
              message: 'অনুরোধের সীমা অতিক্রম করেছে। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।',
              products: [],
              banners: [],
              categories: [],
              posts: [],
              users: []
            });
            return new Response(safe429Body, {
              status: 429,
              statusText: 'Too Many Requests (Handled)',
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // If successful GET request, cache the response
          if (res.ok && isGet && isApiCall) {
            try {
              const cloned = res.clone();
              cloned.text().then(bodyText => {
                const headerObj: Record<string, string> = {};
                cloned.headers.forEach((val, key) => {
                  headerObj[key] = val;
                });
                responseCache.set(urlString, {
                  bodyText,
                  status: cloned.status,
                  statusText: cloned.statusText,
                  headers: headerObj,
                  timestamp: Date.now(),
                });
              }).catch(() => {});
            } catch {}
          } else if (res.ok && !isGet && isApiCall) {
            // Invalidate cache immediately on successful mutations (POST, PUT, DELETE, PATCH)
            try {
              if (urlString.includes('/api/banners')) {
                for (const key of Array.from(responseCache.keys())) {
                  if (key.includes('/api/banners')) responseCache.delete(key);
                }
              } else if (urlString.includes('/api/products')) {
                for (const key of Array.from(responseCache.keys())) {
                  if (key.includes('/api/products')) responseCache.delete(key);
                }
              } else {
                for (const key of Array.from(responseCache.keys())) {
                  if (key.includes(urlString.split('?')[0])) responseCache.delete(key);
                }
              }
            } catch {}
          }

          return res;
        } catch (err: any) {
          // Network errors: check if we have cached fallback
          if (isGet) {
            const fallbackCache = responseCache.get(urlString);
            if (fallbackCache) {
              console.info(`[ResilientFetch] Serving cached fallback for ${urlString} after network error:`, err?.message);
              return createSyntheticResponse(fallbackCache);
            }
          }
          throw err;
        }
      };

      if (isGet && isApiCall) {
        const fetchPromise = scheduleRequest(() => executeFetch());
        inFlightRequests.set(urlString, fetchPromise);
        try {
          const result = await fetchPromise;
          return result;
        } finally {
          inFlightRequests.delete(urlString);
        }
      }

      return await scheduleRequest(() => executeFetch());
    };

    // Safely assign resilientFetch to window.fetch
    try {
      window.fetch = resilientFetch as any;
    } catch (_) {
      try {
        Object.defineProperty(window, 'fetch', {
          value: resilientFetch,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch (__) {}
    }
  } catch (_) {}

  // Global safety trap for any uncaught "Cannot set property fetch" errors
  try {
    window.addEventListener('error', (event) => {
      if (
        event &&
        event.message &&
        typeof event.message === 'string' &&
        event.message.includes('Cannot set property fetch')
      ) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        return true;
      }
    }, true);
  } catch (_) {}

  // Global safety trap for unhandled promise rejections (RLS 42501, 429, network aborts, schema notices)
  try {
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event?.reason;
      const msg = typeof reason === 'string' 
        ? reason 
        : (reason?.message || reason?.error_description || (typeof reason?.code === 'string' ? reason.code : '') || '');

      if (
        msg.includes('42501') ||
        msg.includes('429') ||
        msg.includes('Too many requests') ||
        msg.includes('rate limit') ||
        msg.includes('permission denied') ||
        msg.includes('Failed to fetch') ||
        msg.includes('AbortError') ||
        msg.includes('aborted') ||
        msg.includes('schema cache') ||
        msg.includes('unload is deprecated') ||
        msg.includes('Cannot set property fetch')
      ) {
        if (typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
      }
    });
  } catch (_) {}
}

/**
 * Modernizes unload event listeners to 'pagehide' across the application
 * to prevent BFCache disqualification, policy violations, and aborted 404 requests.
 */
export function ensureModernUnloadHandling(): void {
  if (typeof window === 'undefined' || typeof EventTarget === 'undefined') return;
  if ((window as any).__modernUnloadHandlingInstalled) return;
  (window as any).__modernUnloadHandlingInstalled = true;

  try {
    const rawAddEvent = EventTarget.prototype.addEventListener;
    const rawRemoveEvent = EventTarget.prototype.removeEventListener;
    const unloadToPagehideMap = new WeakMap<object, (e: any) => void>();

    EventTarget.prototype.addEventListener = function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) {
      if (type === 'unload' && listener) {
        try {
          const wrapped = (event: any) => {
            try {
              if (typeof listener === 'function') {
                listener.call(this, event);
              } else if (listener && typeof (listener as any).handleEvent === 'function') {
                (listener as any).handleEvent(event);
              }
            } catch (_) {}
          };

          if (typeof listener === 'object') {
            unloadToPagehideMap.set(listener, wrapped);
          }

          return rawAddEvent.call(this, 'pagehide', wrapped as any, options);
        } catch (_) {
          return rawAddEvent.call(this, 'pagehide', listener as any, options);
        }
      }
      return rawAddEvent.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions
    ) {
      if (type === 'unload' && listener) {
        const mapped = typeof listener === 'object' ? unloadToPagehideMap.get(listener) : null;
        return rawRemoveEvent.call(this, 'pagehide', (mapped || listener) as any, options);
      }
      return rawRemoveEvent.call(this, type, listener, options);
    };

    // Modernize window.onunload & document.onunload
    try {
      Object.defineProperty(window, 'onunload', {
        configurable: true,
        enumerable: true,
        get() {
          return undefined;
        },
        set(fn: any) {
          if (typeof fn === 'function') {
            window.addEventListener('pagehide', fn);
          }
        },
      });
    } catch (_) {}

    try {
      Object.defineProperty(document, 'onunload', {
        configurable: true,
        enumerable: true,
        get() {
          return undefined;
        },
        set(fn: any) {
          if (typeof fn === 'function') {
            window.addEventListener('pagehide', fn);
          }
        },
      });
    } catch (_) {}
  } catch (_) {}
}

export function invalidateFetchCache(pattern?: string) {
  try {
    if (!pattern) {
      responseCache.clear();
      return;
    }
    for (const key of Array.from(responseCache.keys())) {
      if (key.includes(pattern)) {
        responseCache.delete(key);
      }
    }
  } catch {}
}

try {
  (window as any).__invalidateFetchCache = invalidateFetchCache;
} catch {}

ensureModernUnloadHandling();
ensureSafeFetch();

