/**
 * WEB3 PROVIDER - Blockchain & Wallet Connection Setup
 *
 * This file configures the THREE layers needed for Web3 functionality:
 *
 * 1. WAGMI - Core blockchain interactions (read/write contracts, wallet connections)
 * 2. REACT QUERY - Caching and state management for blockchain data
 * 3. CONNECTKIT - Beautiful wallet connection UI (WalletConnect, MetaMask, etc.)
 *
 * BLOCKCHAIN BASICS FOR BEGINNERS:
 * - "Web3" = interacting with blockchain (Ethereum, Base, etc.)
 * - "Wallet" = user's account (like MetaMask) that holds crypto and signs transactions
 * - "RPC" = server that lets us read/write blockchain data
 * - "Chain" = which blockchain network (testnet for dev, mainnet for production)
 *
 * WHY THREE PROVIDERS?
 * - WagmiProvider: Low-level blockchain connection and contract calls
 * - QueryClientProvider: Caches blockchain data so we don't spam the network
 * - ConnectKitProvider: Pretty UI for connecting wallets (modal, buttons, etc.)
 *
 * @see config/chains.ts for network configuration (dev/prod)
 * @see https://wagmi.sh for Wagmi documentation
 */

"use client";

import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { env } from "../utils/env";
import { getChainConfig } from "../config/chains";

// STEP 1: Get chain configuration based on environment
// In development: Use Base Sepolia (testnet) - free fake ETH for testing
// In production: Use Base (mainnet) - real money, be careful!
const chainConfig = getChainConfig();

// STEP 2: Create Wagmi configuration
// This tells Wagmi which blockchains to support and how to connect to them
const config = createConfig(
  getDefaultConfig({
    // Which blockchain networks to support
    chains: chainConfig.chains,

    // How to connect to each chain (RPC endpoints with fallbacks)
    // Uses multiple RPC providers for reliability - if one fails, automatically tries the next
    // This prevents "connection failed" errors from single point of failure
    transports: Object.fromEntries(
      chainConfig.chains.map(chain => {
        const primaryRpc = chainConfig.transports[chain.id];

        // Configure fallback RPCs based on chain
        // Base Sepolia (testnet): Multiple public endpoints
        // Base Mainnet (production): Primary + reliable fallbacks
        const fallbackRpcs = chain.id === 84532 // Base Sepolia
          ? [
              'https://base-sepolia.blockpi.network/v1/rpc/public',
              'https://sepolia.base.org'
            ]
          : [  // Base Mainnet (8453)
              'https://base.blockpi.network/v1/rpc/public',
              'https://mainnet.base.org',
              'https://base.meowrpc.com'
            ];

        return [
          chain.id,
          fallback([
            http(primaryRpc),  // Try primary RPC first
            ...fallbackRpcs.map(url => http(url))  // Then try fallbacks in order
          ])
        ];
      })
    ),

    // WalletConnect configuration (for mobile wallets like Rainbow, Trust Wallet)
    walletConnectProjectId: env.walletConnectProjectId,

    // App metadata shown in wallet connection modals
    appName: "Memed.fun",
    appDescription: "Turn your memes into tokens.",
    appUrl: "https://memed.fun",
    appIcon: "https://memed.fun/icon.png",
  })
);

// STEP 3: Create React Query client
// This caches blockchain data so we don't need to re-fetch constantly.
// Example: If we read a token balance, it's cached for a few seconds.
const queryClient = new QueryClient();

/**
 * WEB3 PROVIDER COMPONENT
 *
 * This wraps the entire app in three nested providers.
 * The order matters! Each provider depends on the one above it.
 *
 * PROVIDER NESTING:
 * 1. WagmiProvider (outermost) - Blockchain connection
 * 2. QueryClientProvider (middle) - Data caching
 * 3. ConnectKitProvider (innermost) - Wallet UI
 *
 * WHAT THIS ENABLES:
 * - useAccount() - Get connected wallet address
 * - useReadContract() - Read data from smart contracts
 * - useWriteContract() - Write data to smart contracts (costs gas!)
 * - ConnectKit modal - Beautiful wallet connection UI
 *
 * @param children - The rest of the app (from root.tsx)
 */
export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
