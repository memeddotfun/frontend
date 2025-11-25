/**
 * CHAIN CONFIGURATION - Network Setup for Development & Production
 *
 * This file determines which blockchain network the app connects to.
 * It automatically switches between testnet (dev) and mainnet (prod).
 *
 * BLOCKCHAIN NETWORKS EXPLAINED:
 *
 * BASE SEPOLIA (Testnet):
 * - Used during development
 * - Free "fake" ETH for testing (get from faucets)
 * - Transactions are fast and don't cost real money
 * - Safe place to break things and experiment
 * - Chain ID: 84532
 *
 * BASE (Mainnet):
 * - Used in production
 * - Real ETH - costs actual money!
 * - Transactions are permanent and irreversible
 * - Must be extremely careful here
 * - Chain ID: 8453
 *
 * WHY SEPARATE NETWORKS?
 * - Test new features without risking real money
 * - Prevent accidental mainnet deployments during development
 * - Deploy to testnet first, then mainnet after thorough testing
 *
 * RPC ENDPOINTS:
 * - RPC = "Remote Procedure Call" server
 * - It's how we talk to the blockchain (read balances, send transactions)
 * - Like an API for blockchain data
 * - Each network has its own RPC URL
 *
 * @see https://docs.base.org for Base network documentation
 */

import { chains } from "@lens-chain/sdk/viem";
import { env } from "../utils/env";
import { baseSepolia, base } from "wagmi/chains";

/**
 * GET CHAIN CONFIGURATION
 *
 * Returns network config based on the current environment.
 * This function is called once during app initialization.
 *
 * RETURN VALUE:
 * {
 *   chains: [ChainObject] - Array of supported blockchain networks
 *   transports: { chainId: rpcUrl } - How to connect to each network
 * }
 *
 * ENVIRONMENT DETECTION:
 * - Checks env.isDevelopment (set in utils/env.ts)
 * - isDevelopment = true when running `npm run dev`
 * - isDevelopment = false when running `npm run build` (production)
 *
 * SAFETY FEATURE:
 * - Development ONLY allows testnet (prevents accidental mainnet usage)
 * - Production ONLY allows mainnet (prevents testnet in production)
 * - No mixing = less room for costly mistakes
 */
export function getChainConfig() {
  const isDevelopment = env.isDevelopment;

  if (isDevelopment) {
    // DEVELOPMENT MODE
    // Use Base Sepolia testnet only
    // Developers get free test ETH and can safely experiment
    return {
      chains: [baseSepolia] as const,
      transports: {
        // Map chain ID (84532) to RPC endpoint
        // baseSepolia.rpcUrls.default.http[0] = "https://sepolia.base.org"
        [baseSepolia.id]: baseSepolia.rpcUrls.default.http[0]!,
      },
    };
  } else {
    // PRODUCTION MODE
    // Use Base mainnet only
    // Real transactions with real ETH - be very careful!
    return {
      //leave basesepolia to test on production for the team
      //
      chains: [baseSepolia] as const,
      transports: {
        // Map chain ID (8453) to RPC endpoint
        // base.rpcUrls.default.http[0] = "https://mainnet.base.org"
        [baseSepolia.id]: baseSepolia.rpcUrls.default.http[0]!,
      },
    };
  }
}
