/**
 * ENVIRONMENT CONFIGURATION - Validates and exports environment variables
 *
 * WHAT ARE ENVIRONMENT VARIABLES?
 * - Configuration values that change between environments (dev/prod)
 * - Stored in .env file (NOT committed to git for security)
 * - Examples: API keys, backend URLs, feature flags
 *
 * WHY VALIDATE?
 * - Catch missing config early (at startup, not at runtime)
 * - Provide clear error messages for developers
 * - Ensure app doesn't start with broken config
 *
 * HOW TO USE:
 * 1. Copy .env.example to .env
 * 2. Fill in your values
 * 3. Restart the dev server
 * 4. This file validates and exports the values
 *
 * SECURITY NOTE:
 * - .env file is in .gitignore (never commit it!)
 * - Only non-sensitive values should be here
 * - API keys here are for PUBLIC APIs only (they'll be visible in browser)
 *
 * @see .env.example for required variables
 */

/**
 * VALIDATE ENVIRONMENT
 *
 * This function runs ONCE when the app starts.
 * It checks that all required environment variables are set.
 * If anything is missing, it throws an error and stops the app.
 *
 * VITE ENVIRONMENT VARIABLES:
 * - Vite requires all env vars to start with VITE_
 * - Access them with import.meta.env.VITE_YOUR_VAR
 * - They're replaced at build time (not runtime)
 *
 * FALLBACK VALUES:
 * - Some variables have defaults (||  "default value")
 * - Required variables throw errors if missing
 * - Optional variables return undefined
 */
export function validateEnvironment() {
  // REQUIRED: WalletConnect Project ID
  // Get yours at: https://cloud.walletconnect.com/
  // Used for mobile wallet connections (Rainbow, Trust Wallet, etc.)
  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

  // REQUIRED: IPFS Gateway
  // IPFS = decentralized file storage for meme images
  // Gateway = HTTP URL to access IPFS files
  // Example: "https://gateway.pinata.cloud/ipfs/"
  const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY;

  // VALIDATION: Check required variables
  if (!walletConnectProjectId) {
    throw new Error(
      "VITE_WALLETCONNECT_PROJECT_ID is required. Please add it to your .env file.",
    );
  }

  if (!ipfsGateway) {
    throw new Error(
      "VITE_IPFS_GATEWAY is required. Please add it to your .env file.",
    );
  }

  // RETURN: Validated and typed environment config
  return {
    // =================================================================
    // WEB3 & WALLET CONFIGURATION
    // =================================================================
    walletConnectProjectId,

    // =================================================================
    // API CONFIGURATION
    // =================================================================

    // Backend API base URL
    // Dev: Usually http://localhost:3000 or your local backend
    // Prod: https://backend.memed.fun
    apiBaseUrl:
      import.meta.env.VITE_APP_BACKEND || "https://backend.memed.fun/",

    // API request timeout in milliseconds
    // 60000ms = 60 seconds (good for slow endpoints like token creation)
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "60000", 10),

    // Number of times to retry failed API requests
    // Helps handle temporary network issues
    apiRetries: parseInt(import.meta.env.VITE_API_RETRIES || "3", 10),

    // Whether to cache API responses
    // Reduces backend load and improves performance
    // Set to "false" to disable caching during debugging
    enableApiCache: import.meta.env.VITE_ENABLE_API_CACHE !== "false",

    // =================================================================
    // EXTERNAL SERVICES
    // =================================================================

    // Lens Protocol API URL
    // Lens = decentralized social media protocol
    // We use it for social features (profiles, posts, etc.)
    lensApiUrl: import.meta.env.VITE_LENS_API_URL || "https://api-v2.lens.dev",

    // IPFS Gateway URL (validated above)
    ipfsGateway,

    // =================================================================
    // ENVIRONMENT FLAGS
    // =================================================================

    // Which environment are we in?
    // "development" | "staging" | "production"
    environment: import.meta.env.VITE_ENVIRONMENT || "development",

    // Is this development mode?
    // true when running `npm run dev`
    // Used to show debug info, enable dev tools, etc.
    isDevelopment: import.meta.env.DEV,

    // Is this production mode?
    // true when running `npm run build` (production build)
    // Used to enable optimizations, hide debug info, etc.
    isProduction: import.meta.env.PROD,
  };
}

/**
 * ENV EXPORT
 *
 * This is what you import throughout the app.
 * It's validated once at startup, then reused everywhere.
 *
 * USAGE EXAMPLE:
 * ```typescript
 * import { env } from '@/utils/env';
 *
 * const apiUrl = env.apiBaseUrl;
 * const isDev = env.isDevelopment;
 * ```
 *
 * WHY NOT ACCESS import.meta.env DIRECTLY?
 * - Type safety: env has proper TypeScript types
 * - Validation: We know all required vars are set
 * - Defaults: We handle fallback values in one place
 * - Convenience: Cleaner imports throughout the app
 */
export const env = validateEnvironment();
