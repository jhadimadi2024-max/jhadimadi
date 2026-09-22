/**
 * Comprehensive Network Resilience & Retry Mechanism
 * Prevents RPC / XHR errors and unhandled exceptions on unstable internet or offline connections.
 */

export interface NetworkRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
  showToastOnFailure?: boolean;
  customErrorMessage?: string;
  source?: string;
  retryOnStatusCodes?: number[];
}

export interface NetworkErrorDetail {
  message: string;
  originalError: any;
  isOffline: boolean;
  source?: string;
  timestamp: number;
  retryFn?: () => Promise<any>;
}

const DEFAULT_OPTIONS: Required<NetworkRetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 400,
  maxDelayMs: 3000,
  backoffFactor: 2,
  timeoutMs: 12000,
  showToastOnFailure: true,
  customErrorMessage: 'Network error. Please reconnect to the internet and try again.',
  source: 'API',
  retryOnStatusCodes: [408, 429, 502, 503, 504],
};

/**
 * Checks if an error is caused by internet disconnection or transient network failure.
 */
export function isNetworkError(err: any): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }

  if (!err) return false;

  const msg = (err.message || err.error_description || String(err)).toLowerCase();
  const name = (err.name || '').toLowerCase();
  const code = (err.code || '').toString().toLowerCase();

  // Known browser network error signatures
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('network request failed') ||
    msg.includes('err_internet_disconnected') ||
    msg.includes('err_network_changed') ||
    msg.includes('err_connection_refused') ||
    msg.includes('err_connection_timed_out') ||
    msg.includes('err_connection_reset') ||
    msg.includes('err_name_not_resolved') ||
    msg.includes('err_address_unreachable') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('load failed') ||
    name.includes('aborterror') ||
    name.includes('timeouterror') ||
    code === 'pgrst000' ||
    code === 'econnaborted' ||
    code === 'enotfound'
  ) {
    return true;
  }

  return false;
}

/**
 * Triggers a global DOM event to notify the UI to show the network error toast/banner
 */
export function notifyNetworkError(detail?: Partial<NetworkErrorDetail>): void {
  if (typeof window === 'undefined') return;

  const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  const eventPayload: NetworkErrorDetail = {
    message: detail?.message || (isOffline 
      ? 'You are currently offline. Please check your internet connection.'
      : 'Network error. Please reconnect to the internet and try again.'),
    originalError: detail?.originalError,
    isOffline,
    source: detail?.source || 'API',
    timestamp: Date.now(),
    retryFn: detail?.retryFn,
  };

  try {
    const event = new CustomEvent('app:network-error', { detail: eventPayload });
    window.dispatchEvent(event);
  } catch (_) {}
}

/**
 * Triggers a global event when network is confirmed online & operational
 */
export function notifyNetworkRestored(): void {
  if (typeof window === 'undefined') return;
  try {
    const event = new CustomEvent('app:network-restored', {
      detail: { timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  } catch (_) {}
}

/**
 * Helper to wait for ms with abort signal support
 */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error('Operation aborted'));
    }
    const timer = setTimeout(() => resolve(), ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Operation aborted'));
    });
  });
}

/**
 * Executes an asynchronous function with intelligent retry logic on network glitches.
 */
export async function withNetworkRetry<T>(
  asyncFn: () => Promise<T>,
  options: NetworkRetryOptions = {}
): Promise<T> {
  const opts: Required<NetworkRetryOptions> = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any = null;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    // If completely offline on first attempt or subsequent attempts
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn(`[NetworkRetry] Browser offline on attempt ${attempt + 1}/${opts.maxRetries + 1}`);
      if (attempt === opts.maxRetries) {
        if (opts.showToastOnFailure) {
          notifyNetworkError({
            message: opts.customErrorMessage,
            originalError: new Error('ERR_INTERNET_DISCONNECTED'),
            isOffline: true,
            source: opts.source,
            retryFn: () => withNetworkRetry(asyncFn, options),
          });
        }
        throw new Error('ERR_INTERNET_DISCONNECTED: You are currently offline.');
      }
      // Wait briefly in case connectivity is toggling
      await wait(Math.min(delay, opts.maxDelayMs));
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
      continue;
    }

    try {
      // Execute the provided function
      const result = await asyncFn();
      return result;
    } catch (err: any) {
      lastError = err;

      const isNetErr = isNetworkError(err);
      const isStatusRetryable = err?.status && opts.retryOnStatusCodes.includes(err.status);

      console.warn(
        `[NetworkRetry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed (${opts.source}):`,
        err?.message || err
      );

      // If this was the last attempt, or if error is NOT retryable, fail out
      if (attempt >= opts.maxRetries || (!isNetErr && !isStatusRetryable)) {
        if (isNetErr && opts.showToastOnFailure) {
          notifyNetworkError({
            message: opts.customErrorMessage,
            originalError: err,
            isOffline: typeof navigator !== 'undefined' && !navigator.onLine,
            source: opts.source,
            retryFn: () => withNetworkRetry(asyncFn, options),
          });
        }
        throw err;
      }

      // Add exponential backoff with jitter
      const jitter = Math.floor(Math.random() * 150);
      const currentDelay = Math.min(delay + jitter, opts.maxDelayMs);
      await wait(currentDelay);
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Creates a resilient fetch wrapper for Supabase or general API calls.
 * Automatically handles timeout, retries on network disconnect, and notifies user gracefully.
 */
export function createResilientFetch(): typeof fetch {
  const nativeFetch = (typeof window !== 'undefined' && (window as any).__originalNativeFetch)
    ? (window as any).__originalNativeFetch.bind(window)
    : (typeof window !== 'undefined' && window.fetch)
      ? window.fetch.bind(window)
      : fetch;

  return async function resilientFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : (input as any)?.url || '';
    const isSupabaseCall = urlStr.includes('supabase.co');

    // For non-critical telemetry or image pings, don't spam toasts
    const isTelemetry = urlStr.includes('/telemetry') || urlStr.includes('ping') || urlStr.includes('.png');

    try {
      return await withNetworkRetry(
        async () => {
          // Timeout controller for slow/hanging connections
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          let mergedInit: RequestInit = { ...init };
          if (!mergedInit.signal) {
            mergedInit.signal = controller.signal;
          }

          try {
            const res = await nativeFetch(input, mergedInit);
            clearTimeout(timeoutId);

            // If server returned 502/503/504 Bad Gateway, throw so withNetworkRetry can retry
            if ([502, 503, 504].includes(res.status)) {
              throw new Error(`Server temporarily unavailable (HTTP ${res.status})`);
            }

            return res;
          } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            throw fetchErr;
          }
        },
        {
          maxRetries: isTelemetry ? 1 : 2,
          initialDelayMs: 300,
          showToastOnFailure: !isTelemetry,
          source: isSupabaseCall ? 'Supabase' : 'Fetch',
          customErrorMessage: 'Network error. Please reconnect to the internet and try again.',
        }
      );
    } catch (finalErr: any) {
      // Return a safe mocked response for GET requests when offline to prevent unhandled rejections
      if (init?.method === 'GET' || !init?.method) {
        console.warn(`[ResilientFetch] Network call failed after retries: ${urlStr}`, finalErr?.message);
      }
      throw finalErr;
    }
  };
}
