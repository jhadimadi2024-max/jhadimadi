/**
 * Safe External Script & Analytics Loader Utility
 * Ensures third-party scripts (Tidio, Google Analytics, Tag Manager, Pixels)
 * fail gracefully without throwing uncaught errors or breaking the UI when blocked or offline.
 */

export interface ScriptLoadOptions {
  id?: string;
  async?: boolean;
  defer?: boolean;
  timeoutMs?: number;
  attributes?: Record<string, string>;
}

/**
 * Loads an external JavaScript file safely with timeout and error fallback.
 * Resolves to true if loaded successfully, or false if blocked / network unavailable.
 */
export function loadExternalScriptSafely(
  src: string,
  options: ScriptLoadOptions = {}
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  // If user is currently completely offline, bypass immediately to save bandwidth & errors
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn(`[SafeScriptLoader] Network offline: skipping external script ${src}`);
    return Promise.resolve(false);
  }

  const { id, async = true, defer = true, timeoutMs = 8000, attributes = {} } = options;

  // If script element with this ID already exists, return resolved
  if (id && document.getElementById(id)) {
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    let hasResolved = false;
    let timeoutTimer: any = null;

    const cleanup = () => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };

    const handleSuccess = () => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();
      resolve(true);
    };

    const handleFailure = (reason: string) => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();
      console.warn(`[SafeScriptLoader] External script bypassed gracefully (${reason}): ${src}`);
      // Never reject - resolve false so caller application remains 100% stable
      resolve(false);
    };

    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = async;
      script.defer = defer;
      if (id) script.id = id;

      Object.entries(attributes).forEach(([k, v]) => {
        try {
          script.setAttribute(k, v);
        } catch (_) {}
      });

      script.onload = handleSuccess;
      script.onerror = (e) => {
        // Prevent event propagation so browser error console doesn't report fatal failure
        if (e && typeof (e as any).preventDefault === 'function') {
          (e as any).preventDefault();
        }
        handleFailure('Network failure or ad-blocker restriction');
      };

      // Set timeout fallback
      timeoutTimer = setTimeout(() => {
        handleFailure('Loading timed out after ' + timeoutMs + 'ms');
      }, timeoutMs);

      const target = document.head || document.body || document.documentElement;
      target.appendChild(script);
    } catch (err: any) {
      handleFailure(err?.message || 'Script injection exception');
    }
  });
}

/**
 * Initializes safe shims for common third-party tracking APIs to prevent "cannot read properties of undefined"
 */
export function initSafeAnalyticsShims(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Google Tag Manager / Analytics shims
    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    if (typeof win.gtag !== 'function') {
      win.gtag = function () {
        try {
          win.dataLayer.push(arguments);
        } catch (_) {}
      };
    }

    // 2. Tidio Chat API safe shim
    if (!win.tidioChatApi) {
      win.tidioChatApi = {
        hide: () => {},
        show: () => {},
        open: () => {},
        close: () => {},
        on: () => {},
        off: () => {},
        setColor: () => {},
        setVisitorData: () => {},
        isReady: false,
      };
    }

    // 3. Facebook / Meta Pixel safe shim
    if (typeof win.fbq !== 'function') {
      win.fbq = function () {};
      win._fbq = win.fbq;
    }
  } catch (_) {}
}
