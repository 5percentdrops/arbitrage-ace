// Global API helper with timeout, JSON parsing, and error handling

const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string>,
  timeout: number = DEFAULT_TIMEOUT
): Promise<ApiResponse<T>> {
  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetchWithTimeout(
      url.toString(),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      timeout
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Endpoint not available',
          status: response.status,
        };
      }
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data, status: response.status };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out' };
      }
      // Network errors (backend not running)
      if (error.message.includes('fetch')) {
        return { success: false, error: 'Endpoint not available' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

export async function apiPost<T>(
  endpoint: string,
  body: object,
  timeout: number = DEFAULT_TIMEOUT
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      timeout
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Endpoint not available',
          status: response.status,
        };
      }
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data, status: response.status };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out' };
      }
      if (error.message.includes('fetch')) {
        return { success: false, error: 'Endpoint not available' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}
