import { chains } from "@lens-chain/sdk/viem";
import { env } from "../utils/env";
import { baseSepolia, base } from "wagmi/chains";
/**
 * Chain configuration for Memed.fun based on environment
 */
export function getChainConfig() {
  const isDevelopment = env.isDevelopment;

  if (isDevelopment) {
    // Development: Use testnet only for safe testing
    return {
      chains: [baseSepolia] as const,
      transports: {
        [baseSepolia.id]: baseSepolia.rpcUrls.default.http[0]!,
      },
    };
  } else {
    // Production: Use mainnet only
    return {
      chains: [base] as const,
      transports: {
        [base.id]: base.rpcUrls.default.http[0]!,
      },
    };
  }
}
