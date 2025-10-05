import { chains } from "@lens-chain/sdk/viem";
import { env } from "../utils/env";
import { baseSepolia, base } from "wagmi/chains";
/**
 * Chain configuration for Memed.fun based on environment
 */
export function getChainConfig() {
  const isDevelopment = env.isDevelopment;

  if (isDevelopment) {
    // Development: Use both mainnet and testnet for testing
    return {
      chains: [base, baseSepolia] as const,
      transports: {
        [base.id]: base.rpcUrls.default.http[0]!,
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
