/**
 * API CONFIGURATION - Central Registry of Backend Endpoints and Settings
 *
 * This file is the MAP of our backend API. It defines WHERE to send requests
 * and HOW to configure them.
 *
 * ============================================================================
 * FOR JUNIOR DEVELOPERS: API CONCEPTS
 * ============================================================================
 *
 * WHAT IS AN API?
 * - API = "Application Programming Interface"
 * - It's how our frontend (this app) talks to the backend (server)
 * - Like a menu at a restaurant: you order (request), kitchen prepares, waiter brings (response)
 *
 * REST API BASICS:
 * - REST = "Representational State Transfer" (fancy way to say structured URLs)
 * - Each endpoint is a URL path like /api/tokens or /api/users/123
 * - We use HTTP methods (GET, POST, etc.) to perform actions
 *
 * URL PARTS EXPLAINED:
 * - Base URL: https://backend.memed.fun (the server)
 * - Endpoint: /api/tokens (what you want)
 * - Full URL: https://backend.memed.fun/api/tokens
 *
 * PATH PARAMETERS (dynamic parts):
 * - /api/users/:address - :address is a placeholder
 * - Becomes: /api/users/0x123abc... (specific user)
 * - Like filling in a template: "Hello, [YOUR NAME]" → "Hello, Alice"
 *
 * QUERY PARAMETERS (filters/options):
 * - /api/tokens?limit=10&sort=popular
 * - The ? starts query params, & separates them
 * - Like adding filters to a search: "show me 10 popular tokens"
 *
 * ============================================================================
 * WHY CENTRALIZE ENDPOINTS?
 * ============================================================================
 *
 * BEFORE (Bad - Scattered):
 * Component1.tsx: fetch('/api/tokens')
 * Component2.tsx: fetch('/api/tokns') ← TYPO! Hard to find!
 * Component3.tsx: fetch('https://backend.memed.fun/api/tokens') ← Hardcoded!
 *
 * AFTER (Good - Centralized):
 * config.ts: API_ENDPOINTS.TOKENS = '/api/tokens'
 * Component1.tsx: apiClient.get(API_ENDPOINTS.TOKENS)
 * Component2.tsx: apiClient.get(API_ENDPOINTS.TOKENS)
 * Component3.tsx: apiClient.get(API_ENDPOINTS.TOKENS)
 *
 * BENEFITS:
 * - Fix typos in ONE place instead of hunting through 50 files
 * - Change endpoint? Update once, works everywhere
 * - TypeScript autocomplete helps you find the right endpoint
 * - See all available endpoints in one file
 *
 * @see client.ts for the HTTP client that uses these endpoints
 * @see env.ts for base URL configuration
 */

import { env } from "@/utils/env";

/**
 * API CONFIGURATION TYPE
 *
 * Defines the shape of API configuration object.
 * All values come from validated environment variables.
 *
 * PROPERTIES:
 * - baseUrl: Backend server URL (changes per environment)
 * - timeout: Max milliseconds before canceling request
 * - retries: How many times to retry failed requests
 * - enableCache: Whether to cache API responses
 * - lensApiUrl: Lens Protocol API URL (external service)
 * - ipfsGateway: IPFS gateway URL (for decentralized storage)
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  enableCache: boolean;
  lensApiUrl: string;
  ipfsGateway: string;
}

/**
 * GET API CONFIGURATION
 *
 * Returns validated API configuration from environment variables.
 * Called by the HTTP client during initialization.
 *
 * ENVIRONMENT EXAMPLES:
 * - Development: baseUrl = http://localhost:3000
 * - Production: baseUrl = https://backend.memed.fun
 *
 * VALIDATION:
 * - Checks if timeout is too low (< 1 second)
 * - Logs warning if settings seem wrong
 * - Prevents common configuration mistakes
 *
 * @returns Complete API configuration object
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

  // VALIDATION: Warn if timeout is dangerously low
  // 1000ms = 1 second (too short for most API calls)
  if (config.timeout < 1000) {
    console.warn("API timeout is very low, consider increasing it");
  }

  return config;
}

/**
 * ============================================================================
 * API ENDPOINTS - The Map of Our Backend
 * ============================================================================
 *
 * This object defines EVERY endpoint in our backend API.
 * Each key is a descriptive name, each value is the URL path.
 *
 * PATH PARAMETERS (dynamic parts):
 * - :memeId - Replaced with actual token ID (e.g., :memeId → 42)
 * - :address - Replaced with wallet address (e.g., :address → 0x123...)
 * - :id - Generic ID placeholder
 * - :postId - Lens post ID
 * - :type - Leaderboard type (tokens, users, battles)
 *
 * USE buildEndpoint() FUNCTION:
 * Instead of manually replacing :memeId, use the helper:
 * buildEndpoint(API_ENDPOINTS.TOKEN_DETAIL, { memeId: 42 })
 * → /api/token/42
 *
 * ORGANIZATION:
 * Endpoints are grouped by feature area for easy navigation.
 * Use Ctrl+F to search for what you need!
 */
export const API_ENDPOINTS = {
  // ========================================================================
  // TOKENS - Meme token management
  // ========================================================================

  /**
   * GET /api/tokens
   * Fetch all meme tokens on the platform
   * Returns: Array of token objects with metadata, prices, stats
   */
  TOKENS: "/api/tokens",

  /**
   * GET /api/token/:memeId
   * Fetch single token details by ID
   * Path params: { memeId: number | string }
   * Returns: Token object with full details
   */
  TOKEN_DETAIL: "/api/token/:memeId",

  /**
   * POST /api/create-token
   * Create a new meme token
   * Body: { name, ticker, description, image }
   * Returns: Newly created token object
   */
  CREATE_TOKEN: "/api/create-token",

  /**
   * POST /api/tokens/buy
   * Buy tokens on bonding curve
   * Body: { tokenId, amount, slippage }
   * Returns: Transaction details, price, tokens received
   */
  TOKEN_BUY: "/api/tokens/buy",

  /**
   * POST /api/tokens/sell
   * Sell tokens on bonding curve
   * Body: { tokenId, amount, slippage }
   * Returns: Transaction details, price, ETH received
   */
  TOKEN_SELL: "/api/tokens/sell",

  /**
   * GET /api/tokens/:id/bonding-curve
   * Get bonding curve data (price chart)
   * Path params: { id: tokenId }
   * Returns: Price points, current price, liquidity
   */
  BONDING_CURVE: "/api/tokens/:id/bonding-curve",

  // ========================================================================
  // BATTLES - Meme vs Meme competitions
  // ========================================================================

  /**
   * GET /api/battles
   * Fetch all battles (active and past)
   * Query params: { status?, limit?, offset? }
   * Returns: Array of battle objects
   */
  BATTLES: "/api/battles",

  /**
   * GET /api/battles/:id
   * Fetch single battle details
   * Path params: { id: battleId }
   * Returns: Battle object with participants, stakes, status
   */
  BATTLE_DETAIL: "/api/battles/:id",

  /**
   * POST /api/battles/create
   * Create a new battle between two tokens
   * Body: { tokenA, tokenB, duration }
   * Returns: Created battle object
   */
  BATTLE_CREATE: "/api/battles/create",

  /**
   * POST /api/battles/stake
   * Stake NFTs on a battle side
   * Body: { battleId, side, nftIds[] }
   * Returns: Staking confirmation, total staked
   */
  BATTLE_STAKE: "/api/battles/stake",

  // ========================================================================
  // STAKING - NFT and token staking
  // ========================================================================

  /**
   * GET /api/staking/positions
   * Fetch user's staking positions
   * Query params: { address: userAddress }
   * Returns: Array of active stakes with rewards
   */
  STAKING_POSITIONS: "/api/staking/positions",

  /**
   * POST /api/staking/claim
   * Claim staking rewards
   * Body: { positionId }
   * Returns: Claimed amount, updated position
   */
  STAKING_CLAIM: "/api/staking/claim",

  // ========================================================================
  // LENS INTEGRATION - Social protocol
  // ========================================================================

  /**
   * GET /api/lens/engagement/:postId
   * Get engagement data for a Lens post
   * Path params: { postId: lensPostId }
   * Returns: Likes, mirrors, comments, rewards
   */
  LENS_ENGAGEMENT: "/api/lens/engagement/:postId",

  /**
   * POST /api/lens/engagement/update
   * Update engagement data (called by backend cron job)
   * Body: { postId, engagement }
   * Returns: Updated engagement object
   */
  LENS_UPDATE: "/api/lens/engagement/update",

  // ========================================================================
  // ANALYTICS - Platform and token statistics
  // ========================================================================

  /**
   * GET /api/analytics/token/:id
   * Get analytics for a specific token
   * Path params: { id: tokenId }
   * Returns: Volume, holders, price history, heat score
   */
  TOKEN_ANALYTICS: "/api/analytics/token/:id",

  /**
   * GET /api/analytics/platform
   * Get platform-wide statistics
   * Returns: Total tokens, users, volume, active battles
   */
  PLATFORM_STATS: "/api/analytics/platform",

  // ========================================================================
  // USER - User profiles and data
  // ========================================================================

  /**
   * GET /api/user
   * Get current authenticated user's data
   * Requires: Valid session cookie
   * Returns: User object with tokens, battles, socials
   */
  GET_USER: "/api/user",

  /**
   * GET /api/users/:address
   * Get public profile of any user by wallet address
   * Path params: { address: walletAddress }
   * Returns: Public user data, tokens created, battles
   */
  USER_PROFILE: "/api/users/:address",

  /**
   * GET /api/leaderboard/:type
   * Get leaderboards by category
   * Path params: { type: "tokens" | "users" | "battles" }
   * Query params: { limit?, period? }
   * Returns: Ranked list of top performers
   */
  LEADERBOARD: "/api/leaderboard/:type",

  // ========================================================================
  // UPLOAD - File and metadata uploads
  // ========================================================================

  /**
   * POST /api/upload/image
   * Upload meme image to IPFS
   * Body: FormData with image file
   * Returns: IPFS hash, gateway URL
   */
  UPLOAD_IMAGE: "/api/upload/image",

  /**
   * POST /api/upload/metadata
   * Upload token metadata to IPFS
   * Body: { name, description, image, attributes }
   * Returns: IPFS hash, metadata URI
   */
  UPLOAD_METADATA: "/api/upload/metadata",

  // ========================================================================
  // AUTH - Authentication and wallet connection
  // ========================================================================

  /**
   * POST /api/create-nonce
   * Generate a nonce for wallet signature
   * Body: { address: walletAddress }
   * Returns: { nonce: randomString }
   * Used for: Secure wallet authentication (sign-in with Ethereum)
   */
  CREATE_NONCE: "/api/create-nonce",

  /**
   * POST /api/connect-wallet
   * Authenticate user with signed nonce
   * Body: { address, signature, nonce }
   * Returns: User object, session cookie
   * Creates: New user if first time connecting
   */
  CONNECT_WALLET: "/api/connect-wallet",

  /**
   * POST /api/connect-social
   * Link social account (Lens, Twitter) to user
   * Body: { type: "LENS" | "TWITTER", username }
   * Returns: Updated user object with linked social
   */
  CONNECT_SOCIAL: "/api/connect-social",

  /**
   * POST /api/disconnect-wallet
   * Log out user, clear session
   * Body: none
   * Returns: Success message
   * Clears: Session cookie
   */
  DISCONNECT_WALLET: "/api/disconnect-wallet",
} as const;

/**
 * ============================================================================
 * HTTP STATUS CODES
 * ============================================================================
 *
 * Standard HTTP status codes used throughout the API.
 * These numbers tell you what happened with your request.
 *
 * STATUS CODE CATEGORIES:
 * - 2xx: Success (request worked!)
 * - 4xx: Client error (you did something wrong)
 * - 5xx: Server error (backend has a problem)
 *
 * COMMON CODES EXPLAINED:
 * - 200 OK: Request succeeded, here's your data
 * - 201 CREATED: New resource created successfully
 * - 400 BAD REQUEST: Your request has invalid data
 * - 401 UNAUTHORIZED: You need to log in first
 * - 404 NOT FOUND: That resource doesn't exist
 * - 500 INTERNAL SERVER ERROR: Backend crashed (not your fault!)
 *
 * WHY DEFINE THESE?
 * - No magic numbers: Use HTTP_STATUS.NOT_FOUND instead of 404
 * - TypeScript autocomplete helps you remember status codes
 * - Easy to search: "Where do we handle 404?" → Search for NOT_FOUND
 */
export const HTTP_STATUS = {
  // 2xx SUCCESS
  OK: 200,                    // Request succeeded
  CREATED: 201,               // Resource created
  NO_CONTENT: 204,            // Success, no response body

  // 4xx CLIENT ERRORS (Your Code's Fault)
  BAD_REQUEST: 400,           // Invalid request data
  UNAUTHORIZED: 401,          // Need to authenticate first
  FORBIDDEN: 403,             // Authenticated but not allowed
  NOT_FOUND: 404,             // Resource doesn't exist
  CONFLICT: 409,              // Resource already exists
  UNPROCESSABLE_ENTITY: 422,  // Valid syntax, invalid semantics
  TOO_MANY_REQUESTS: 429,     // Rate limit exceeded

  // 5xx SERVER ERRORS (Backend's Fault)
  INTERNAL_SERVER_ERROR: 500, // Backend crashed
  BAD_GATEWAY: 502,           // Backend server unreachable
  SERVICE_UNAVAILABLE: 503,   // Backend temporarily down
} as const;

/**
 * ============================================================================
 * MEMED ERROR CODES
 * ============================================================================
 *
 * Application-specific error codes for business logic errors.
 * These go beyond HTTP status codes to provide specific context.
 *
 * WHY CUSTOM ERROR CODES?
 * - HTTP 400 just says "bad request" - but WHY is it bad?
 * - INSUFFICIENT_BALANCE tells you exactly what's wrong
 * - Frontend can show specific error messages based on code
 * - Easier to track and debug specific error scenarios
 *
 * USAGE:
 * if (error.code === MEMED_ERROR_CODES.INSUFFICIENT_BALANCE) {
 *   toast.error("You don't have enough tokens to sell!");
 * }
 */
export const MEMED_ERROR_CODES = {
  // TOKEN ERRORS
  TOKEN_NOT_FOUND: "TOKEN_NOT_FOUND",                   // Token ID doesn't exist
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",         // Not enough tokens/ETH
  PRICE_SLIPPAGE_TOO_HIGH: "PRICE_SLIPPAGE_TOO_HIGH", // Price moved too much
  TOKEN_LAUNCH_NOT_READY: "TOKEN_LAUNCH_NOT_READY",   // Launch still in progress

  // BATTLE ERRORS
  BATTLE_NOT_ACTIVE: "BATTLE_NOT_ACTIVE",               // Battle hasn't started yet
  BATTLE_ALREADY_ENDED: "BATTLE_ALREADY_ENDED",         // Battle is over
  INSUFFICIENT_STAKE: "INSUFFICIENT_STAKE",             // Need more NFTs to stake

  // STAKING ERRORS
  POSITION_NOT_FOUND: "POSITION_NOT_FOUND",             // Staking position doesn't exist
  UNSTAKE_TOO_EARLY: "UNSTAKE_TOO_EARLY",               // Lock period not finished
  NO_REWARDS_AVAILABLE: "NO_REWARDS_AVAILABLE",         // No rewards to claim

  // LENS ERRORS
  LENS_POST_NOT_FOUND: "LENS_POST_NOT_FOUND",           // Lens post ID invalid
  LENS_API_ERROR: "LENS_API_ERROR",                     // Lens API is down
  INVALID_LENS_HANDLE: "INVALID_LENS_HANDLE",           // Username doesn't exist

  // GENERAL ERRORS
  WALLET_NOT_CONNECTED: "WALLET_NOT_CONNECTED",         // Need to connect wallet
  TRANSACTION_FAILED: "TRANSACTION_FAILED",             // Blockchain tx failed
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",           // Too many requests
} as const;

/**
 * ============================================================================
 * DEFAULT HEADERS
 * ============================================================================
 *
 * HTTP headers sent with EVERY request (unless overridden).
 *
 * WHAT ARE HEADERS?
 * - Extra information sent with requests/responses
 * - Like putting a return address on an envelope
 * - Tell the server what format you expect, who you are, etc.
 *
 * COMMON HEADERS EXPLAINED:
 * - Content-Type: Format of request body (JSON, FormData, etc.)
 * - Accept: What format you want in response (we want JSON)
 * - X-Client: Tells backend this is the web app (vs mobile app)
 * - X-Version: API version for compatibility tracking
 */
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",  // We're sending JSON data
  Accept: "application/json",          // We want JSON back
  "X-Client": "memed-web",             // Identifies this as web client
  "X-Version": "1.0.0",                // API version we're using
} as const;

/**
 * ============================================================================
 * CACHE CONFIGURATION
 * ============================================================================
 *
 * How long to cache different types of data before re-fetching.
 * Measured in milliseconds (1000ms = 1 second).
 *
 * WHY CACHE?
 * - Reduce backend load (don't fetch same data 100 times/second)
 * - Faster UX (instant results from cache)
 * - Save bandwidth (fewer network requests)
 *
 * CACHE DURATION GUIDELINES:
 * - SHORT (30s): Real-time data that changes frequently
 *   Examples: Token prices, active battle scores
 *
 * - MEDIUM (2min): Data that changes but not constantly
 *   Examples: Token info, user profiles
 *
 * - LONG (5min): Data that rarely changes
 *   Examples: Leaderboards, platform stats
 *
 * - VERY_LONG (15min): Static or slow-changing data
 *   Examples: Token metadata, historical data
 *
 * TRADE-OFFS:
 * - Longer cache = Faster UX but potentially stale data
 * - Shorter cache = Fresh data but more backend load
 */
export const CACHE_CONFIG = {
  SHORT: 30 * 1000,          // 30 seconds
  MEDIUM: 2 * 60 * 1000,     // 2 minutes
  LONG: 5 * 60 * 1000,       // 5 minutes
  VERY_LONG: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * ============================================================================
 * BUILD ENDPOINT - URL Construction Utility
 * ============================================================================
 *
 * Builds complete endpoint URLs with path and query parameters.
 * Replaces :placeholders and adds ?query=strings automatically.
 *
 * PATH PARAMETERS (in the URL path):
 * buildEndpoint('/api/token/:id', { id: 42 })
 * → /api/token/42
 *
 * QUERY PARAMETERS (after the ?):
 * buildEndpoint('/api/tokens', {}, { limit: 10, sort: 'popular' })
 * → /api/tokens?limit=10&sort=popular
 *
 * BOTH TOGETHER:
 * buildEndpoint('/api/users/:address', { address: '0x123' }, { includeTokens: true })
 * → /api/users/0x123?includeTokens=true
 *
 * WHY USE THIS?
 * - Automatic URL encoding (handles special characters)
 * - No manual string concatenation ('/api/token/' + id) ← error-prone!
 * - Type-safe parameters with TypeScript
 * - Handles edge cases (undefined values, special characters, etc.)
 *
 * @param endpoint - URL template with :placeholders
 * @param params - Object mapping placeholder names to values
 * @param query - Object of query string parameters
 * @returns Complete URL with parameters filled in
 *
 * @example
 * // Path params only
 * buildEndpoint(API_ENDPOINTS.TOKEN_DETAIL, { memeId: 42 })
 * // → '/api/token/42'
 *
 * @example
 * // Query params only
 * buildEndpoint(API_ENDPOINTS.TOKENS, {}, { limit: 10, offset: 20 })
 * // → '/api/tokens?limit=10&offset=20'
 *
 * @example
 * // Both path and query params
 * buildEndpoint(API_ENDPOINTS.USER_PROFILE, { address: '0xABC' }, { includeStats: true })
 * // → '/api/users/0xABC?includeStats=true'
 */
export function buildEndpoint(
  endpoint: string,
  params: Record<string, string | number> = {},
  query: Record<string, string | number | boolean> = {},
): string {
  let url = endpoint;

  // STEP 1: Replace path parameters
  // Loops through { id: 42, address: '0x123' }
  // Replaces :id with 42, :address with 0x123
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, String(value));
  });

  // STEP 2: Build query string
  // URLSearchParams handles encoding special characters
  const queryString = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    queryString.append(key, String(value));
  });

  // STEP 3: Append query string if it exists
  // Only add ? if there are query params
  if (queryString.toString()) {
    url += `?${queryString.toString()}`;
  }

  return url;
}

/**
 * ============================================================================
 * IS RETRYABLE ERROR - Retry Decision Logic
 * ============================================================================
 *
 * Determines if an error should trigger a retry or fail immediately.
 *
 * RETRY THESE:
 * - Network errors (no status code) - maybe internet hiccuped
 * - 429 Too Many Requests - backend is rate limiting, try again later
 * - 500-599 Server errors - backend crashed, might recover
 *
 * DON'T RETRY THESE:
 * - 400-499 Client errors (except 429) - your code has a bug, retrying won't help
 *   - 400 Bad Request - fix your request data
 *   - 401 Unauthorized - user needs to log in
 *   - 404 Not Found - resource doesn't exist, retrying won't create it
 *
 * WHY?
 * - Retrying client errors wastes time and backend resources
 * - Server errors might be temporary (overload, restart, etc.)
 * - Network errors could be temporary connection issues
 *
 * @param error - Error object with optional status property
 * @returns true if error should be retried, false otherwise
 */
export function isRetryableError(error: any): boolean {
  // No status code = network error (connection failed, timeout)
  // These are retryable - maybe internet connection dropped
  if (!error.status) return true;

  const status = error.status;

  // CLIENT ERRORS (4xx) - Usually NOT retryable
  if (status >= 400 && status < 500) {
    // EXCEPTION: 429 Too Many Requests IS retryable
    // Wait a bit and try again (backend will accept request later)
    return status === HTTP_STATUS.TOO_MANY_REQUESTS;
  }

  // SERVER ERRORS (5xx) - Usually retryable
  // Backend might recover after a moment
  return status >= 500;
}

/**
 * ============================================================================
 * DEVELOPMENT UTILITIES
 * ============================================================================
 *
 * Debugging helpers that are only enabled in development mode.
 *
 * FEATURES:
 * - logRequests: Log all API calls to console
 * - mockDelay: Add artificial delay to simulate slow network
 * - enableDebugLogs: Show detailed debug information
 *
 * WHY MOCK DELAY?
 * - Test loading states (spinners, skeletons)
 * - Simulate slow network for UX testing
 * - Catch race conditions that only appear on slow connections
 *
 * USAGE:
 * if (DEV_UTILS.logRequests) {
 *   console.log('Fetching:', url);
 * }
 */
export const DEV_UTILS = {
  logRequests: import.meta.env.DEV,         // Log API calls in development
  mockDelay: import.meta.env.DEV ? 500 : 0, // Add 500ms delay in dev
  enableDebugLogs: import.meta.env.DEV,     // Enable debug logging
} as const;
