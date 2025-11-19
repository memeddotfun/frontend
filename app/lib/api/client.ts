/**
 * HTTP API CLIENT - The Heart of Backend Communication
 *
 * This file is THE central place for all HTTP requests to our backend API.
 * Every API call in the app flows through this client.
 *
 * ============================================================================
 * FOR JUNIOR DEVELOPERS: HTTP BASICS
 * ============================================================================
 *
 * WHAT IS HTTP?
 * - HTTP = "HyperText Transfer Protocol"
 * - It's how browsers talk to servers over the internet
 * - Like sending letters: you write (request), mail it, and get a reply (response)
 *
 * HTTP METHODS (VERBS):
 * - GET: Fetch data (like reading a book)
 * - POST: Create new data (like writing a new chapter)
 * - PUT: Replace existing data (like rewriting a whole chapter)
 * - PATCH: Update part of existing data (like fixing a typo)
 * - DELETE: Remove data (like erasing a chapter)
 *
 * EXAMPLE FLOW:
 * 1. Component calls: apiClient.get('/tokens')
 * 2. Client sends HTTP GET request to backend.memed.fun/api/tokens
 * 3. Backend processes request and sends back JSON data
 * 4. Client returns the data to your component
 *
 * ============================================================================
 * KEY FEATURES OF THIS CLIENT
 * ============================================================================
 *
 * 1. AUTOMATIC RETRIES
 *    - If request fails (network hiccup), it tries again
 *    - Uses "exponential backoff" (wait longer each time)
 *    - Only retries on network errors, not on your coding bugs (4xx errors)
 *
 * 2. TIMEOUT HANDLING
 *    - Cancels requests that take too long (default 60 seconds)
 *    - Prevents hanging forever if backend is slow/down
 *
 * 3. ERROR NORMALIZATION
 *    - Converts all errors to consistent format
 *    - Makes error handling easier throughout the app
 *
 * 4. ENVIRONMENT-AWARE
 *    - Automatically uses correct backend URL (dev vs prod)
 *    - Configured from environment variables
 *
 * @see config.ts for endpoint definitions
 * @see env.ts for environment configuration
 */

import { getApiConfig } from "./config";

/**
 * API RESPONSE TYPE
 *
 * This is the shape of ALL successful API responses.
 * The backend always wraps data in this structure.
 *
 * STRUCTURE:
 * {
 *   data: {...},        // The actual data you want
 *   success: true,      // Whether request succeeded
 *   message: "...",     // Optional success message
 * }
 *
 * GENERIC TYPE <T>:
 * - T is a placeholder for the actual data type
 * - Example: ApiResponse<Token[]> means data is an array of tokens
 * - Gives you TypeScript autocomplete for the data field!
 */
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * API ERROR TYPE
 *
 * This is the shape of error objects thrown by the client.
 * All errors are normalized to this format for consistent handling.
 *
 * USAGE:
 * try {
 *   await apiClient.get('/tokens');
 * } catch (error) {
 *   const apiError = error as ApiError;
 *   console.log(apiError.message, apiError.status);
 * }
 */
export interface ApiError {
  message: string;   // Human-readable error message
  status: number;    // HTTP status code (404, 500, etc.)
  code?: string;     // Optional error code for specific errors
  details?: any;     // Optional additional error details
}

/**
 * REQUEST CONFIGURATION TYPE
 *
 * Extends the standard RequestInit (from fetch API) with custom options.
 *
 * CUSTOM OPTIONS:
 * - timeout: Max milliseconds before canceling (default 60000)
 * - retries: How many times to retry failed requests (default 3 for GET, 0 for POST)
 * - retryDelay: Base delay between retries in ms (default 1000)
 *
 * WHY EXTEND RequestInit?
 * - RequestInit has standard options (method, headers, body, etc.)
 * - We add our own options on top for advanced features
 */
export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * ============================================================================
 * API CLIENT CLASS
 * ============================================================================
 *
 * The main HTTP client with retry logic, timeout handling, and error normalization.
 * This is a "class" - a blueprint for creating HTTP client objects.
 *
 * WHY USE A CLASS?
 * - Encapsulation: Groups related functionality together
 * - State management: Stores baseURL, timeout, retries as properties
 * - Reusability: Can create multiple instances with different configs
 * - Methods: Provides clean API (get, post, put, patch, delete)
 *
 * SINGLETON PATTERN:
 * - We create ONE instance at the bottom of this file (apiClient)
 * - Everyone imports and uses the same instance
 * - Ensures consistent configuration across the app
 */
class ApiClient {
  // PRIVATE PROPERTIES (only accessible inside this class)
  // readonly = can't be changed after construction
  private readonly baseURL: string;
  private readonly defaultTimeout: number;
  private readonly defaultRetries: number;
  private readonly defaultRetryDelay: number = 1000; // 1 second

  /**
   * CONSTRUCTOR - Runs when creating a new ApiClient
   *
   * Sets up the client with configuration from environment.
   * Called once when the app starts.
   *
   * @param baseURL - Optional override for API base URL
   */
  constructor(baseURL?: string) {
    const config = getApiConfig();

    this.baseURL = baseURL || config.baseUrl;
    this.defaultTimeout = config.timeout;
    this.defaultRetries = config.retries;
  }

  // ==========================================
  // PRIVATE UTILITY METHODS
  // ==========================================

  /**
   * DELAY HELPER
   *
   * Creates a Promise that resolves after a delay.
   * Used for waiting between retries (with exponential backoff).
   *
   * EXAMPLE:
   * await this.delay(1000); // Wait 1 second
   *
   * HOW IT WORKS:
   * - Creates a new Promise
   * - setTimeout calls resolve() after ms milliseconds
   * - await waits for the Promise to resolve
   *
   * @param ms - Milliseconds to wait
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * FETCH WITH TIMEOUT
   *
   * Wraps the standard fetch() with automatic timeout cancellation.
   * If request takes too long, it's automatically aborted.
   *
   * HOW TIMEOUT WORKS:
   * 1. Create an AbortController (cancellation token)
   * 2. Start a timer that aborts after X milliseconds
   * 3. Pass controller.signal to fetch (so it can be canceled)
   * 4. If fetch completes first, cancel the timer
   * 5. If timer fires first, abort the fetch
   *
   * WHY?
   * - Prevents hanging requests when backend is slow/down
   * - Gives user faster feedback instead of waiting forever
   * - Frees up resources (no zombie requests)
   *
   * @param url - Full URL to fetch
   * @param config - Request configuration
   * @returns Response object from fetch
   * @throws Error if timeout occurs or network fails
   */
  private async fetchWithTimeout(
    url: string,
    config: RequestConfig,
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchConfig } = config;

    // Create abort controller for cancellation
    const controller = new AbortController();

    // Start timeout timer
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Make the fetch request with abort signal
      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
      });

      // Request completed before timeout - cancel the timer
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      // Request failed or timed out - cancel the timer
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ==========================================
  // CORE REQUEST METHOD WITH RETRY LOGIC
  // ==========================================

  /**
   * REQUEST - The core method that powers all HTTP calls
   *
   * This is the ENGINE of the API client. All HTTP methods (get, post, etc.)
   * call this method under the hood.
   *
   * RETRY LOGIC WITH EXPONENTIAL BACKOFF:
   * - Attempt 0: Try immediately
   * - Attempt 1: Wait 1 second (1000ms * 2^0)
   * - Attempt 2: Wait 2 seconds (1000ms * 2^1)
   * - Attempt 3: Wait 4 seconds (1000ms * 2^2)
   * - And so on...
   *
   * WHY EXPONENTIAL BACKOFF?
   * - If backend is overloaded, don't spam it with immediate retries
   * - Give it time to recover
   * - Standard practice in distributed systems
   *
   * WHAT GETS RETRIED?
   * - Network errors (connection failed, timeout)
   * - 5xx errors (backend server errors)
   *
   * WHAT DOESN'T GET RETRIED?
   * - 4xx errors (your code has a bug, retrying won't help)
   * - Timeout errors (already waited long enough)
   * - POST/PUT/PATCH requests (to avoid duplicate data creation)
   *
   * @param endpoint - API endpoint (e.g., '/tokens')
   * @param config - Request configuration
   * @returns Normalized API response
   * @throws ApiError if all retries fail
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const {
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...requestConfig
    } = config;

    // Build full URL
    const url = `${this.baseURL}${endpoint}`;

    let lastError: Error;

    // RETRY LOOP
    // If retries = 3, this runs 4 times (attempts 0, 1, 2, 3)
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Make the HTTP request with timeout protection
        const response = await this.fetchWithTimeout(url, {
          credentials: "include", // Send cookies with request (for auth)
          ...requestConfig,
        });

        // CHECK: Did the HTTP request fail? (404, 500, etc.)
        if (!response.ok) {
          // Try to extract error message from response body
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        // SUCCESS! Parse JSON response
        const data = await response.json();

        // CHECK: Is response already in our standard format?
        if (data && typeof data === "object" && "success" in data) {
          return data as ApiResponse<T>;
        }

        // NORMALIZE: Wrap raw data in standard format
        return {
          data,
          success: true,
        };
      } catch (error) {
        lastError = error as Error;

        // CHECK: Is this an error we should NOT retry?

        // 1. Timeout errors - already waited long enough
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Request timeout");
        }

        // 2. Client errors (4xx) - our code has a bug, retrying won't help
        if (error instanceof Error && error.message.includes("HTTP 4")) {
          throw error;
        }

        // WAIT before next retry (exponential backoff)
        // Don't wait after the last attempt (we're about to throw anyway)
        if (attempt < retries) {
          const delayMs = retryDelay * Math.pow(2, attempt);
          await this.delay(delayMs);
        }
      }
    }

    // All retries exhausted - throw the last error we caught
    throw lastError!;
  }

  // ==========================================
  // PUBLIC HTTP METHODS
  // ==========================================

  /**
   * GET - Fetch data from the server
   *
   * Used for reading data without side effects.
   * Safe to retry (reading data multiple times is fine).
   *
   * EXAMPLES:
   * - Get all tokens: apiClient.get<Token[]>('/api/tokens')
   * - Get one token: apiClient.get<Token>('/api/tokens/123')
   * - Get user data: apiClient.get<User>('/api/users/me')
   *
   * @param endpoint - API endpoint path
   * @param config - Optional request configuration
   * @returns Promise with API response
   */
  async get<T>(
    endpoint: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "GET",
      headers: config?.headers,
    });
  }

  /**
   * POST - Create new data on the server
   *
   * Used for creating resources, submitting forms, uploading files.
   * NOT retried by default (to avoid creating duplicates).
   *
   * SUPPORTS TWO DATA TYPES:
   * 1. JSON: Pass an object, we stringify it automatically
   * 2. FormData: Pass FormData directly (for file uploads)
   *
   * EXAMPLES:
   * - Create token: apiClient.post('/api/tokens', { name: 'MyToken' })
   * - Upload image: apiClient.post('/api/upload', formData)
   * - Submit form: apiClient.post('/api/commit', { amount: 100 })
   *
   * WHY NO RETRIES?
   * - If first request succeeds but response is lost, retrying creates duplicates
   * - Better to fail fast and let user retry manually
   *
   * @param endpoint - API endpoint path
   * @param data - Data to send (object for JSON, FormData for files)
   * @param config - Optional request configuration
   * @returns Promise with API response
   */
  async post<T>(
    endpoint: string,
    data?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    const headers = new Headers(config.headers);

    if (isFormData) {
      // DON'T set Content-Type for FormData
      // Browser sets it automatically with boundary (multipart/form-data; boundary=...)
      headers.delete("Content-Type");
    } else {
      // Set Content-Type for JSON data
      headers.set("Content-Type", "application/json");
    }

    return this.request<T>(endpoint, {
      retries: 0, // NO retries for POST (avoid duplicates)
      ...config,
      method: "POST",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      headers: headers,
    });
  }

  /**
   * PUT - Replace existing data on the server
   *
   * Used for updating entire resources (full replacement).
   * NOT retried by default.
   *
   * DIFFERENCE FROM PATCH:
   * - PUT: Replace the whole thing (like overwriting a file)
   * - PATCH: Update just some fields (like editing part of a file)
   *
   * EXAMPLE:
   * - Update token: apiClient.put('/api/tokens/123', { name: 'NewName', ticker: 'NEW' })
   *
   * @param endpoint - API endpoint path
   * @param data - Data to send
   * @param config - Optional request configuration
   * @returns Promise with API response
   */
  async put<T>(
    endpoint: string,
    data?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    const headers = new Headers(config.headers);

    if (isFormData) {
      headers.delete("Content-Type");
    } else {
      headers.set("Content-Type", "application/json");
    }

    return this.request<T>(endpoint, {
      retries: 0, // NO retries for PUT
      ...config,
      method: "PUT",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      headers: headers,
    });
  }

  /**
   * PATCH - Partially update existing data
   *
   * Used for updating specific fields without replacing the whole resource.
   * NOT retried by default.
   *
   * EXAMPLE:
   * - Update just the name: apiClient.patch('/api/tokens/123', { name: 'NewName' })
   *
   * @param endpoint - API endpoint path
   * @param data - Data to send (only fields to update)
   * @param config - Optional request configuration
   * @returns Promise with API response
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    const headers = new Headers(config.headers);

    if (isFormData) {
      headers.delete("Content-Type");
    } else {
      headers.set("Content-Type", "application/json");
    }

    return this.request<T>(endpoint, {
      retries: 0, // NO retries for PATCH
      ...config,
      method: "PATCH",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      headers: headers,
    });
  }

  /**
   * DELETE - Remove data from the server
   *
   * Used for deleting resources.
   *
   * EXAMPLE:
   * - Delete token: apiClient.delete('/api/tokens/123')
   *
   * @param endpoint - API endpoint path
   * @param config - Optional request configuration
   * @returns Promise with API response
   */
  async delete<T>(
    endpoint: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }
}

/**
 * ============================================================================
 * SINGLETON EXPORT
 * ============================================================================
 *
 * This is THE instance everyone uses.
 * Created once when the app starts, reused everywhere.
 *
 * USAGE IN COMPONENTS:
 * ```typescript
 * import { apiClient } from '@/lib/api/client';
 *
 * const tokens = await apiClient.get('/api/tokens');
 * ```
 *
 * WHY SINGLETON?
 * - Consistent configuration across the app
 * - No need to pass client instance around
 * - Easier to mock in tests
 */
export const apiClient = new ApiClient();

/**
 * ALSO EXPORT THE CLASS
 *
 * In case you need to create a custom instance with different config.
 * Most of the time you'll use apiClient, not this.
 *
 * ADVANCED USAGE:
 * ```typescript
 * const customClient = new ApiClient('https://other-api.com');
 * ```
 */
export { ApiClient };
