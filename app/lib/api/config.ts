/**
 * API Configuration and Environment Management for Memed.fun
 *
 * This module provides centralized configuration management for the entire API system:
 *
 * 🌍 **Environment Variables**:
 *   - Vite-compatible environment variable handling
 *   - Development vs production configuration
 *   - Validation and fallback values
 *   - Type-safe environment access
 *
 * 🔗 **API Endpoints**:
 *   - Centralized endpoint definitions
 *   - RESTful route organization
 *   - Version management and consistency
 *   - Easy endpoint updates and maintenance
 *
 * ⚙️ **Configuration Objects**:
 *   - HTTP client settings (timeout, retries)
 *   - Cache configuration and TTL values
 *   - Feature flags and toggles
 *   - External service URLs (Lens, IPFS)
 *
 * 🛡️ **Error Handling**:
 *   - HTTP status code definitions
 *   - API error code constants
 *   - Standardized error messages
 *   - Retry logic configuration
 *
 * 🔧 **Utility Functions**:
 *   - Endpoint URL building
 *   - Environment validation
 *   - Configuration parsing
 *   - Development helpers
 *
 * @example Environment Setup:
 * ```bash
 * # .env.local
 * VITE_API_BASE_URL=https://api.memed.fun
 * VITE_API_TIMEOUT=10000
 * VITE_ENABLE_API_CACHE=true
 * ```
 *
 * @example Usage:
 * ```typescript
 * import { API_ENDPOINTS, getApiConfig } from './config';
 *
 * const config = getApiConfig();
 * const tokenUrl = API_ENDPOINTS.TOKENS.LIST;
 * ```
 */
import { env } from "@/utils/env";

// Environment variable types are defined in app/types/env.d.ts

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  enableCache: boolean;
  lensApiUrl: string;
  ipfsGateway: string;
}

/**
 * Get API configuration from validated environment variables
 */
export function getApiConfig(): ApiConfig {
  const config: ApiConfig = {
    baseUrl: env.apiBaseUrl,
    timeout: env.apiTimeout,
    retries: env.apiRetries,
    enableCache: env.enableApiCache,
    lensApiUrl: env.lensApiUrl,
    ipfsGateway: env.ipfsGateway,
  };

  // Additional validation
  if (config.timeout < 1000) {
    console.warn("API timeout is very low, consider increasing it");
  }

  return config;
}

/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  // Tokens
  TOKENS: "/tokens",
  TOKEN_DETAIL: "/meme/:memeId",
  CREATE_TOKEN: "/create-token",
  TOKEN_BUY: "/tokens/buy",
  TOKEN_SELL: "/tokens/sell",
  BONDING_CURVE: "/tokens/:id/bonding-curve",

  // Battles
  BATTLES: "/battles",
  BATTLE_DETAIL: "/battles/:id",
  BATTLE_CREATE: "/battles/create",
  BATTLE_STAKE: "/battles/stake",

  // Staking
  STAKING_POSITIONS: "/staking/positions",
  STAKING_CLAIM: "/staking/claim",

  // Lens Integration
  LENS_ENGAGEMENT: "/lens/engagement/:postId",
  LENS_UPDATE: "/lens/engagement/update",

  // Analytics
  TOKEN_ANALYTICS: "/analytics/token/:id",
  PLATFORM_STATS: "/analytics/platform",

  // User
  GET_USER: "/user",
  USER_PROFILE: "/users/:address",
  LEADERBOARD: "/leaderboard/:type",

  // Upload
  UPLOAD_IMAGE: "/upload/image",
  UPLOAD_METADATA: "/upload/metadata",

  // Auth
  CREATE_NONCE: "/create-nonce",
  CONNECT_WALLET: "/connect-wallet",
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error codes specific to Memed.fun
 */
export const MEMED_ERROR_CODES = {
  // Token errors
  TOKEN_NOT_FOUND: "TOKEN_NOT_FOUND",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  PRICE_SLIPPAGE_TOO_HIGH: "PRICE_SLIPPAGE_TOO_HIGH",
  TOKEN_LAUNCH_NOT_READY: "TOKEN_LAUNCH_NOT_READY",

  // Battle errors
  BATTLE_NOT_ACTIVE: "BATTLE_NOT_ACTIVE",
  BATTLE_ALREADY_ENDED: "BATTLE_ALREADY_ENDED",
  INSUFFICIENT_STAKE: "INSUFFICIENT_STAKE",

  // Staking errors
  POSITION_NOT_FOUND: "POSITION_NOT_FOUND",
  UNSTAKE_TOO_EARLY: "UNSTAKE_TOO_EARLY",
  NO_REWARDS_AVAILABLE: "NO_REWARDS_AVAILABLE",

  // Lens errors
  LENS_POST_NOT_FOUND: "LENS_POST_NOT_FOUND",
  LENS_API_ERROR: "LENS_API_ERROR",
  INVALID_LENS_HANDLE: "INVALID_LENS_HANDLE",

  // General errors
  WALLET_NOT_CONNECTED: "WALLET_NOT_CONNECTED",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;

/**
 * Request headers
 */
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Client": "memed-web",
  "X-Version": "1.0.0",
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // Short-lived data (real-time prices, battles)
  SHORT: 30 * 1000, // 30 seconds

  // Medium-lived data (token info, user profiles)
  MEDIUM: 2 * 60 * 1000, // 2 minutes

  // Long-lived data (static content, leaderboards)
  LONG: 5 * 60 * 1000, // 5 minutes

  // Very long-lived data (platform stats)
  VERY_LONG: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Utility to build endpoint URLs with parameters
 */
export function buildEndpoint(
  endpoint: string,
  params: Record<string, string | number> = {},
  query: Record<string, string | number | boolean> = {},
): string {
  let url = endpoint;

  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, String(value));
  });

  // Add query parameters
  const queryString = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    queryString.append(key, String(value));
  });

  if (queryString.toString()) {
    url += `?${queryString.toString()}`;
  }

  return url;
}

/**
 * Utility to check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error.status) return true; // Network errors are retryable

  const status = error.status;

  // Don't retry client errors (4xx) except for specific cases
  if (status >= 400 && status < 500) {
    return status === HTTP_STATUS.TOO_MANY_REQUESTS; // Retry rate limits
  }

  // Retry server errors (5xx)
  return status >= 500;
}

/**
 * Development utilities
 */
export const DEV_UTILS = {
  logRequests: import.meta.env.DEV,
  mockDelay: import.meta.env.DEV ? 500 : 0, // Add artificial delay in dev
  enableDebugLogs: import.meta.env.DEV,
} as const;
