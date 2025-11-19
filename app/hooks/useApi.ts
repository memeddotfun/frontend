/**
 * USE API HOOK - React Hooks for Data Fetching with Caching
 *
 * This file provides custom React hooks for fetching and managing data from our backend.
 * It's built on top of the HTTP client (client.ts) and adds React-specific features.
 *
 * ============================================================================
 * FOR JUNIOR DEVELOPERS: REACT HOOKS BASICS
 * ============================================================================
 *
 * WHAT ARE REACT HOOKS?
 * - Functions that "hook into" React features (state, lifecycle, etc.)
 * - Always start with "use" (useState, useEffect, useApi, etc.)
 * - Only work inside React components or other hooks
 * - Make it easy to reuse stateful logic across components
 *
 * WHY CUSTOM HOOKS?
 * - Avoid duplicating data fetching logic in every component
 * - Provide consistent error handling and loading states
 * - Add features like caching, retries, optimistic updates
 * - Make components cleaner and easier to read
 *
 * EXAMPLE WITHOUT CUSTOM HOOK (BAD):
 * ```tsx
 * function TokenList() {
 *   const [tokens, setTokens] = useState([]);
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState(null);
 *
 *   useEffect(() => {
 *     setLoading(true);
 *     fetch('/api/tokens')
 *       .then(res => res.json())
 *       .then(data => setTokens(data))
 *       .catch(err => setError(err))
 *       .finally(() => setLoading(false));
 *   }, []);
 *
 *   // ... render logic
 * }
 * ```
 *
 * EXAMPLE WITH CUSTOM HOOK (GOOD):
 * ```tsx
 * function TokenList() {
 *   const { data: tokens, loading, error } = useApi('/api/tokens', { immediate: true });
 *   // ... render logic
 * }
 * ```
 *
 * ============================================================================
 * HOOKS PROVIDED IN THIS FILE
 * ============================================================================
 *
 * 1. useApi - Fetch data (GET requests) with caching
 * 2. useApiMutation - Create/Update/Delete data (POST/PUT/PATCH/DELETE)
 * 3. useOptimisticApi - Update UI immediately before server confirms
 *
 * @see client.ts for HTTP implementation
 * @see config.ts for API endpoints and cache configuration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, type ApiResponse, type RequestConfig } from '../lib/api/client';
import { CACHE_CONFIG } from '../lib/api/config';

// ==========================================
// TYPESCRIPT TYPES
// ==========================================

/**
 * USE API OPTIONS TYPE
 *
 * Configuration options for the useApi hook.
 * Extends RequestConfig from the HTTP client to inherit timeout, retries, etc.
 *
 * GENERIC TYPE <T>:
 * - T is the type of data you expect from the API
 * - Example: UseApiOptions<Token[]> for fetching an array of tokens
 *
 * KEY OPTIONS EXPLAINED:
 *
 * 1. immediate (boolean):
 *    - If true, fetches data as soon as component mounts
 *    - If false (default), you must call execute() manually
 *    - Example: { immediate: true } - auto-load on mount
 *
 * 2. deps (array):
 *    - Like useEffect dependencies - refetches when these values change
 *    - Example: { deps: [userId] } - refetch when userId changes
 *    - WARNING: Be careful with this to avoid infinite loops!
 *
 * 3. cacheKey (string):
 *    - Unique identifier for caching this request
 *    - If provided, response is cached for faster subsequent loads
 *    - Example: { cacheKey: 'token-list' }
 *
 * 4. cacheDuration (milliseconds):
 *    - How long to keep cached data before fetching again
 *    - Default: 5 minutes (300,000 ms)
 *    - Example: { cacheDuration: CACHE_CONFIG.LONG } - 30 minutes
 *
 * 5. transform (function):
 *    - Modify the response data before storing in state
 *    - Useful for formatting dates, filtering data, etc.
 *    - Example: { transform: (data) => data.filter(t => t.active) }
 *
 * 6. onSuccess / onError (callbacks):
 *    - Functions called after successful/failed requests
 *    - Useful for showing notifications, logging, etc.
 *    - Example: { onSuccess: () => toast.success('Loaded!') }
 */
export interface UseApiOptions extends RequestConfig {
  /** Auto-fetch on mount (default: false) */
  immediate?: boolean;
  /** Dependencies to trigger refetch (like useEffect deps) */
  deps?: React.DependencyList;
  /** Cache key for request deduplication */
  cacheKey?: string;
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
  /** Transform response data before storing */
  transform?<T, R>(data: T): R;
  /** Called when request fails */
  onError?: (error: Error) => void;
  /** Called when request succeeds */
  onSuccess?: <T>(data: T) => void;
}

/**
 * USE API STATE TYPE
 *
 * The internal state shape of the useApi hook.
 * Tracks data, loading status, errors, and success flag.
 *
 * GENERIC TYPE <T>:
 * - T is the type of data you expect from the API
 * - data is T | null (null until data loads)
 *
 * STATE FIELDS:
 * - data: The response data (null if not loaded yet)
 * - loading: True while request is in flight
 * - error: Error object if request failed (null otherwise)
 * - success: True if request succeeded
 */
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

/**
 * USE API RETURN TYPE
 *
 * What the useApi hook returns to your component.
 * Includes all state fields plus control functions.
 *
 * CONTROL FUNCTIONS:
 * - execute(): Manually trigger a fetch
 * - reset(): Clear state (data, error, loading)
 * - refetch(): Re-fetch data (alias for execute)
 *
 * USAGE EXAMPLE:
 * ```tsx
 * const { data, loading, error, execute, reset } = useApi('/api/tokens');
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * return <TokenList tokens={data} onRefresh={execute} />;
 * ```
 */
export interface UseApiReturn<T> extends UseApiState<T> {
  execute: () => Promise<void>;
  reset: () => void;
  refetch: () => Promise<void>;
}

/**
 * Simple in-memory cache for API responses
 * 
 * This cache implementation provides:
 * - TTL (Time To Live) based expiration
 * - Automatic cleanup of expired entries
 * - Type-safe data storage and retrieval
 */
interface CacheEntry<T> {
  data: T;           // Cached response data
  timestamp: number; // When the data was cached (ms)
  duration: number;  // How long to keep the data (ms)
}

// Global cache store - shared across all hook instances
const cache = new Map<string, CacheEntry<any>>();

/**
 * Retrieve cached data if it exists and hasn't expired
 * 
 * @param key - Cache key to lookup
 * @returns Cached data or null if not found/expired
 */
function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  // Check if cache entry has expired
  if (now - entry.timestamp > entry.duration) {
    cache.delete(key); // Clean up expired entry
    return null;
  }
  
  return entry.data;
}

/**
 * Store data in cache with TTL
 * 
 * @param key - Cache key for storage
 * @param data - Data to cache
 * @param duration - How long to keep the data (ms)
 */
function setCachedData<T>(key: string, data: T, duration: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    duration,
  });
}

/**
 * Generic API hook for GET requests with caching and error handling
 * 
 * This hook provides:
 * - Automatic request execution with configurable triggers
 * - Built-in caching with TTL support
 * - Loading states and error handling
 * - Request cancellation on component unmount
 * - Data transformation and success/error callbacks
 * 
 * @param endpoint - API endpoint to call
 * @param options - Configuration options for the hook
 * @returns Object with data, loading state, error, and control functions
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useApi<Token[]>('/tokens', {
 *   immediate: true,
 *   cacheKey: 'tokens-list',
 *   onSuccess: (tokens) => console.log(`Loaded ${tokens.length} tokens`)
 * });
 * ```
 */
export function useApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    deps = [],
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    transform,
    onError,
    onSuccess,
    ...requestConfig
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Check cache on mount
  useEffect(() => {
    if (cacheKey) {
      const cachedData = getCachedData<T>(cacheKey);
      if (cachedData) {
        setState({
          data: cachedData,
          loading: false,
          error: null,
          success: true,
        });
      }
    }
  }, [cacheKey]);

  const execute = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await apiClient.get<T>(endpoint, {
        ...requestConfig,
        signal: abortControllerRef.current.signal,
      });

      if (!mountedRef.current) return;

      let finalData = response.data;
      
      // Apply transform if provided
      if (transform) {
        finalData = transform(response.data);
      }

      // Cache the data if cache key is provided
      if (cacheKey) {
        setCachedData(cacheKey, finalData, cacheDuration);
      }

      setState({
        data: finalData,
        loading: false,
        error: null,
        success: response.success,
      });

      // Call success handler
      if (onSuccess) {
        onSuccess(finalData);
      }

    } catch (error) {
      if (!mountedRef.current) return;
      
      const apiError = error as Error;
      
      setState({
        data: null,
        loading: false,
        error: apiError,
        success: false,
      });

      // Call error handler
      if (onError) {
        onError(apiError);
      }
    }
  }, [endpoint, transform, onError, onSuccess, cacheKey, cacheDuration, ...Object.values(requestConfig)]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  const refetch = useCallback(async () => {
    await execute();
  }, [execute]);

  // Auto-fetch on mount or dependency change
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, ...deps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    refetch,
  };
}

/**
 * Hook for API mutations (POST, PUT, PATCH, DELETE requests)
 * 
 * This hook provides:
 * - Async mutation execution with loading states
 * - Error handling and success callbacks
 * - Data transformation support
 * - Request cancellation capabilities
 * 
 * @param endpoint - API endpoint to call
 * @param options - Configuration options (excluding immediate/deps)
 * @returns Object with mutate function, loading state, and error handling
 * 
 * @example
 * ```tsx
 * const { mutate, loading, error } = useApiMutation<CreateTokenResponse, CreateTokenRequest>('/tokens/create');
 * 
 * const handleCreateToken = async () => {
 *   try {
 *     const result = await mutate({ name: 'MyToken', symbol: 'MTK' });
 *     console.log('Token created:', result.tokenId);
 *   } catch (error) {
 *     console.error('Failed to create token:', error);
 *   }
 * };
 * ```
 */
export function useApiMutation<TData = any, TVariables = any>(
  endpoint: string,
  options: Omit<UseApiOptions, 'immediate' | 'deps'> = {}
) {
  const {
    onError,
    onSuccess,
    ...requestConfig
  } = options;

  const [state, setState] = useState<UseApiState<TData>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const mutate = useCallback(async (variables?: TVariables) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await apiClient.post<TData>(endpoint, variables, requestConfig);

      setState({
        data: response.data,
        loading: false,
        error: null,
        success: response.success,
      });

      if (onSuccess) {
        onSuccess(response.data);
      }

      return response.data;

    } catch (error) {
      const apiError = error as Error;
      
      setState({
        data: null,
        loading: false,
        error: apiError,
        success: false,
      });

      if (onError) {
        onError(apiError);
      }

      throw error;
    }
  }, [endpoint, onError, onSuccess, ...Object.values(requestConfig)]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

/**
 * Hook for optimistic updates with rollback capability
 * 
 * This hook enables optimistic UI updates that can be rolled back if the
 * server request fails. Useful for improving perceived performance by
 * updating the UI immediately before the server confirms the change.
 * 
 * @param queryKey - Unique key to identify this optimistic update
 * @param initialData - Initial data state
 * @returns Object with current data, update function, and rollback capability
 * 
 * @example
 * ```tsx
 * const { data, optimisticUpdate, rollback } = useOptimisticApi('user-profile', user);
 * 
 * const handleUpdateProfile = async (newData) => {
 *   // Immediately update UI
 *   optimisticUpdate(newData);
 *   
 *   try {
 *     await updateUserProfile(newData);
 *   } catch (error) {
 *     // Rollback on failure
 *     rollback();
 *     throw error;
 *   }
 * };
 * ```
 */
export function useOptimisticApi<T>(
  queryKey: string,
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const optimisticUpdate = useCallback((updater: (prev: T) => T) => {
    setData(prev => {
      const newData = updater(prev);
      setIsOptimistic(true);
      return newData;
    });
  }, []);

  const confirmUpdate = useCallback((confirmedData: T) => {
    setData(confirmedData);
    setIsOptimistic(false);
  }, []);

  const revertUpdate = useCallback(() => {
    setData(initialData);
    setIsOptimistic(false);
  }, [initialData]);

  return {
    data,
    isOptimistic,
    optimisticUpdate,
    confirmUpdate,
    revertUpdate,
  };
}
