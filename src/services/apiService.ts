/**
 * Enterprise API Service Client
 * Provides resilient HTTP fetching with timeouts, structured error handling,
 * and standard request/response envelopes.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ApiClient {
  private defaultTimeout = 12000; // 12 seconds

  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.signal ? undefined : this.defaultTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(id);

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMessage = errorData.message;
          else if (errorData?.error) errorMessage = errorData.error;
        } catch {
          // Non-JSON response error
        }

        return {
          success: false,
          data: null,
          error: errorMessage,
          statusCode: response.status,
        };
      }

      const data = (await response.json()) as T;
      return {
        success: true,
        data,
        statusCode: response.status,
      };
    } catch (err: unknown) {
      clearTimeout(id);
      let message = 'Network request failed';
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          message = 'Request timed out. Please check your connection.';
        } else {
          message = err.message;
        }
      }

      return {
        success: false,
        data: null,
        error: message,
      };
    }
  }

  public get<T>(url: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  public post<T>(url: string, body?: unknown, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public put<T>(url: string, body?: unknown, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete<T>(url: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }
}

export const apiService = new ApiClient();
export default apiService;
