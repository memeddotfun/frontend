import { useApiMutation, type UseApiOptions } from "../useApi";
import { API_ENDPOINTS } from "../../lib/api/config";

// Types for Auth API responses
export interface NonceResponse {
  nonce: string;
}

export interface NonceRequest {
  address: string;
}

export interface ConnectWalletRequest {
  address: string;
  signature: string;
  message: string;
}

export interface Image {
  id: string;
  ipfsCid: string;
  s3Key: string;
  createdAt: string;
}

export interface Metadata {
  id: string;
  cid: string;
  name: string;
  ticker: string;
  description: string;
  imageKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface Token {
  id: string;
  fairLaunchId: string;
  address: string;
  image?: Image; // Made optional since it might not always be present
  metadata?: Metadata; // Added metadata property
  metadataId?: string; // Added metadataId property
  userId: string;
  createdAt: string;
  updatedAt: string;
  heat?: bigint | number; // Heat score from contract, used for leaderboard
  phase?: string; // Token phase (e.g., "COMPLETED", "REVEAL", "COMMIT")
  user?: User; // User who created the token (populated in some endpoints)
  failed?: boolean; // Whether the token launch has failed
  claimed?: boolean; // Whether the token has been claimed by creator
  endTime?: string; // Token launch end time
}

export interface Social {
  id: string;
  type: "LENS" | "TWITTER" | "INSTAGRAM";
  username: string;
  accountId: string;
  createdAt: string;
}

export interface User {
  id: string;
  address: string;
  role: string;
  name?: string; // Display name (optional)
  username?: string; // Username (optional)
  socials: Social[];
  token: Token[];
  lastLogin: string;
  createdAt: string;
}

export interface ConnectWalletResponse {
  message: string;
}

// Types for Connect Social
export interface ConnectSocialRequest {
  type: "LENS" | "TWITTER";
  username: string;
}

export interface ConnectSocialResponse {
  message: string;
}

// Retry configuration for critical auth endpoints
// Network blips or temporary backend issues shouldn't block authentication
const CREATE_NONCE_OPTIONS = {
  method: "POST",
  retries: 2,  // Retry up to 2 times on failure
  retryDelay: 1000  // Wait 1 second between retries
};

/**
 * Hook to create a nonce for authentication
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useCreateNonce() {
  return useApiMutation<NonceResponse, NonceRequest>(
    API_ENDPOINTS.CREATE_NONCE,
    CREATE_NONCE_OPTIONS,
  );
}

// Retry configuration for wallet connection
// Most critical step - should be resilient to temporary failures
const CONNECT_WALLET_OPTIONS = {
  method: "POST",
  retries: 2,  // Retry up to 2 times on failure
  retryDelay: 1000  // Wait 1 second between retries
};

/**
 * Hook to connect wallet and verify signature
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useConnectWallet() {
  return useApiMutation<ConnectWalletResponse, ConnectWalletRequest>(
    API_ENDPOINTS.CONNECT_WALLET,
    CONNECT_WALLET_OPTIONS,
  );
}

const CONNECT_SOCIAL_OPTIONS = { method: "POST" };

/**
 * Hook to connect a social account (Lens or Twitter)
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useConnectSocial() {
  return useApiMutation<ConnectSocialResponse, ConnectSocialRequest>(
    API_ENDPOINTS.CONNECT_SOCIAL,
    CONNECT_SOCIAL_OPTIONS,
  );
}

const REFRESH_SOCIALS_OPTIONS = { method: "POST" };

/**
 * Hook to refresh and validate linked social accounts
 * Checks Instagram access tokens, updates usernames, marks accounts as active
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useRefreshSocials() {
  return useApiMutation<{ message: string }, void>(
    API_ENDPOINTS.REFRESH_SOCIALS,
    REFRESH_SOCIALS_OPTIONS,
  );
}

const DISCONNECT_WALLET_OPTIONS = { method: "POST" };

/**
 * Hook to disconnect wallet and log out from the backend
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useDisconnectWallet(
  options: Omit<UseApiOptions, "immediate" | "deps"> = {},
) {
  return useApiMutation<{ message: string }, void>(
    API_ENDPOINTS.DISCONNECT_WALLET,
    { ...DISCONNECT_WALLET_OPTIONS, ...options },
  );
}

const DELETE_ACCOUNT_OPTIONS = { method: "DELETE" };

/**
 * Hook to permanently delete user account and all platform data
 *
 * Eligibility Requirements:
 * - User has NOT started a Fair Launch, OR
 * - User's Fair Launch has FAILED (status 4)
 *
 * What Gets Deleted:
 * - Account information & credentials
 * - Username, email, profile details
 * - Linked social accounts (Lens, Twitter, Instagram)
 * - Social access tokens
 * - Meme uploads & platform interactions
 * - Analytics & session logs
 *
 * What CANNOT Be Deleted (Blockchain Data):
 * - Tokens earned/received
 * - On-chain transactions
 * - Trade history
 * - NFT mint/burn events
 * - Rewards tied to wallet
 *
 * @returns Mutation object with mutate function, loading state, and error handling
 * @throws Error if user is not eligible to delete account (active/completed Fair Launch)
 */
export function useDeleteAccount(
  options: Omit<UseApiOptions, "immediate" | "deps"> = {},
) {
  return useApiMutation<{ message: string }, void>(
    API_ENDPOINTS.DELETE_ACCOUNT,
    { ...DELETE_ACCOUNT_OPTIONS, ...options },
  );
}
