/**
 * React Router Loaders with API Integration for Memed.fun
 *
 * This module provides server-side data fetching utilities that integrate seamlessly
 * with React Router v7 and the Memed.fun API system:
 *
 * 🚀 **Server-Side Rendering (SSR)**:
 *   - Pre-fetch data before route rendering
 *   - Improved initial page load performance
 *   - SEO-friendly data loading
 *   - Reduced client-side loading states
 *
 * 🔄 **Generic Loader Factory**:
 *   - Reusable loader creation utilities
 *   - Type-safe data fetching with generics
 *   - Automatic error handling and fallbacks
 *   - URL parameter substitution
 *
 * 📊 **Parallel Data Loading**:
 *   - Load multiple API endpoints simultaneously
 *   - Optimized performance with Promise.allSettled
 *   - Partial success handling (some requests can fail)
 *   - Structured response format
 *
 * 🛡️ **Error Handling**:
 *   - Graceful error recovery
 *   - Fallback data support
 *   - Consistent error response format
 *   - Development vs production error details
 *
 * 🔧 **Advanced Features**:
 *   - Data transformation before rendering
 *   - Cache integration for repeated requests
 *   - URL parameter extraction and substitution
 *   - Request context passing
 *
 * @example Basic Loader:
 * ```typescript
 * export const tokenLoader = createApiLoader<Token[]>('/tokens', {
 *   fallback: [],
 *   transform: (data) => data.sort((a, b) => b.createdAt - a.createdAt)
 * });
 * ```
 *
 * @example Route Integration:
 * ```typescript
 * // In routes.ts
 * route('/tokens/:id', 'routes/token.tsx', {
 *   loader: createApiLoader<Token>('/tokens/:id')
 * });
 * ```
 *
 * @example Parallel Loading:
 * ```typescript
 * export const dashboardLoader = createParallelLoader({
 *   tokens: '/tokens',
 *   battles: '/battles/active',
 *   stats: '/analytics/overview'
 * });
 * ```
 */

import type { LoaderFunctionArgs } from "react-router";
import { apiClient, type ApiResponse } from "./client";
import { API_ENDPOINTS } from "./config";

import { redirect } from "react-router";
import type { GetUserResponse } from "@/store/auth";

export interface LoaderData<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Generic loader wrapper that handles API calls and error states
 */
export function createApiLoader<T>(
  endpoint: string,
  options: {
    transform?: (data: any) => T;
    fallback?: T;
    cache?: boolean;
    cacheKey?: string;
  } = {},
) {
  console.log(`Creating API loader for endpoint: ${endpoint}`, options);
  return async ({ request, params }: LoaderFunctionArgs): Promise<Response> => {
    try {
      // Replace URL parameters in endpoint
      let finalEndpoint = endpoint;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          finalEndpoint = finalEndpoint.replace(`:${key}`, String(value || ""));
        });
      }

      // Extract query parameters from request URL
      const url = new URL(request.url);
      const searchParams = url.searchParams;

      // Add query parameters to endpoint if any
      if (searchParams.toString()) {
        finalEndpoint += `?${searchParams.toString()}`;
      }

      const cookie = request.headers.get("Cookie");
      const headers: HeadersInit = {};
      if (cookie) {
        headers["Cookie"] = cookie;
      }

      const response = await apiClient.get<T>(finalEndpoint, { headers });

      let finalData = response.data;

      // Apply transform if provided
      if (options.transform) {
        finalData = options.transform(response.data);
      }

      return Response.json({
        data: finalData,
        error: null,
        success: response.success,
      } satisfies LoaderData<T>);
    } catch (error) {
      console.error(`Loader error for ${endpoint}:`, error);

      // Return fallback data if provided
      if (options.fallback !== undefined) {
        return Response.json({
          data: options.fallback,
          error: (error as Error).message,
          success: false,
        } satisfies LoaderData<T>);
      }

      return Response.json({
        data: null,
        error: (error as Error).message,
        success: false,
      } satisfies LoaderData<T>);
    }
  };
}

/**
 * Parallel loader for multiple API calls
 */
export function createParallelLoader<T extends Record<string, any>>(
  loaders: Record<keyof T, string | (() => Promise<any>)>,
) {
  console.log("Creating parallel loader with:", loaders);
  return async ({ request, params }: LoaderFunctionArgs): Promise<Response> => {
    const results: Partial<T> = {};
    const errors: Record<string, string> = {};

    // Execute all loaders in parallel
    await Promise.allSettled(
      Object.entries(loaders).map(async ([key, loader]) => {
        try {
          let data;

          if (typeof loader === "string") {
            // It's an endpoint string
            let endpoint = loader;
            if (params) {
              Object.entries(params).forEach(([paramKey, value]) => {
                endpoint = endpoint.replace(`:${paramKey}`, value || "");
              });
            }

            const url = new URL(request.url);
            const searchParams = url.searchParams;
            if (searchParams.toString()) {
              endpoint += `?${searchParams.toString()}`;
            }

            const cookie = request.headers.get("Cookie");
            const headers: HeadersInit = {};
            if (cookie) {
              headers["Cookie"] = cookie;
            }

            const response = await apiClient.get(endpoint, { headers });
            data = response.data;
          } else {
            // It's a function
            data = await loader();
          }

          results[key as keyof T] = data;
        } catch (error) {
          console.error(`Parallel loader error for ${key}:`, error);
          errors[key] = (error as Error).message;
        }
      }),
    );

    return Response.json({
      data: results,
      errors,
      success: Object.keys(errors).length === 0,
    });
  };
}
/*
These loaders are used if you want to fetch only from one endpoint
 */
// Specific loaders for Memed.fun routes
export const memeTokensLoader = createApiLoader(API_ENDPOINTS.TOKENS, {
  fallback: [],
  transform: (data) => data.tokens || [],
});

export const tokenBattlesLoader = createApiLoader("/battles", {
  fallback: [],
  transform: (data) => data || [],
});

export const memeTokenDetailLoader = createApiLoader(
  API_ENDPOINTS.TOKEN_DETAIL,
  {
    transform: (data) => data.token || null,
  },
);

export const userProfileLoader = createApiLoader<any>("/users/:address");

export const platformStatsLoader = createApiLoader("/analytics/platform", {
  fallback: {
    totalTokens: 0,
    totalVolume: "0",
    totalUsers: 0,
    activeBattles: 0,
    totalStaked: "0",
  },
});

/**
 * Authentication loader to protect routes.
 * Redirects to the home page if the user is not authenticated.
 */
export const authLoader = async ({
  request,
}: LoaderFunctionArgs): Promise<Response> => {
  try {
    const cookie = request.headers.get("Cookie");
    console.log("🍪 Cookie from request:", cookie); // Debug

    const headers: HeadersInit = {};
    if (cookie) {
      headers["Cookie"] = cookie;
    }

    console.log("📤 Sending headers:", headers); // Debug

    const response = await apiClient.get<GetUserResponse>(
      API_ENDPOINTS.GET_USER,
      { headers },
    );

    console.log("📥 Response:", response); // Debug

    if (!response.data.user) {
      console.log("No user found");
      throw redirect("/login");
    }

    return Response.json({
      data: response.data,
      error: null,
      success: true,
    } satisfies LoaderData<GetUserResponse>);
  } catch (error) {
    console.error("❌ Auth loader error:", error);
    throw redirect("/login");
  }
};
/*
These loaders are used if you want to fetch  from multiple endpoint
 */
// Token detail page loader (combines multiple related data)
export const tokenDetailLoader = createParallelLoader({
  token: API_ENDPOINTS.TOKEN_DETAIL,
  bondingCurve: API_ENDPOINTS.BONDING_CURVE,
  analytics: `${API_ENDPOINTS.TOKEN_ANALYTICS}?timeframe=24h`,
  battles: `${API_ENDPOINTS.BATTLES}?tokenId=:tokenId&limit=5`,
});

/**
 * Utility to handle loader data in components
 */
export function useLoaderData<T>(): LoaderData<T> {
  // This would be used with React Router's useLoaderData
  // but we're providing the type safety wrapper
  const data = (globalThis as any).__loaderData__;
  return data as LoaderData<T>;
}

/**
 * Error boundary for loader errors
 */
export function handleLoaderError(error: any): Response {
  console.error("Loader error:", error);

  if (error.status === 404) {
    throw new Response("Not Found", { status: 404 });
  }

  if (error.status >= 400 && error.status < 500) {
    throw new Response("Bad Request", { status: error.status });
  }

  throw new Response("Internal Server Error", { status: 500 });
}

/**
 * Prefetch utility for optimistic loading
 */
export async function prefetchData<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T | null> {
  try {
    let finalEndpoint = endpoint;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        finalEndpoint = finalEndpoint.replace(`:${key}`, value);
      });
    }

    const response = await apiClient.get<T>(finalEndpoint);
    return response.data;
  } catch (error) {
    console.error("Prefetch error:", error);
    return null;
  }
}

/**
 * Cache invalidation utility
 */
export function invalidateCache(patterns: string[]): void {
  // This would integrate with your caching strategy
  // For now, we'll just log the invalidation
  console.log("Invalidating cache for patterns:", patterns);

  // In a real implementation, you might:
  // - Clear React Query cache
  // - Clear SWR cache
  // - Clear custom cache entries
  // - Trigger refetch for active queries
}
