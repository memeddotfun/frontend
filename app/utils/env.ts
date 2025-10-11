/**
 * Environment variable validation and configuration for Memed.fun
 */

export function validateEnvironment() {
  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
  const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY;

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

  return {
    // Web3 & Wallet
    walletConnectProjectId,

    // API Configuration
    apiBaseUrl:
      import.meta.env.VITE_APP_BACKEND || "https://backend.memed.fun/",
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "60000", 10),
    apiRetries: parseInt(import.meta.env.VITE_API_RETRIES || "3", 10),
    enableApiCache: import.meta.env.VITE_ENABLE_API_CACHE !== "false",

    // External Services
    lensApiUrl: import.meta.env.VITE_LENS_API_URL || "https://api-v2.lens.dev",
    ipfsGateway,

    // Environment
    environment: import.meta.env.VITE_ENVIRONMENT || "development",
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
}

export const env = validateEnvironment();
