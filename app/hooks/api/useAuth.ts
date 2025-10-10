import { useApiMutation } from "../useApi";
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

export interface Token {
  id: string;
  fairLaunchId: string;
  address: string;
  image: Image;
  createdAt: string;
}

export interface Social {
  id: string;
  type: "LENS" | "TWITTER";
  username: string;
  accountId: string;
  createdAt: string;
}

export interface User {
  id: string;
  address: string;
  role: string;
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

/**
 * Hook to create a nonce for authentication
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useCreateNonce() {
  return useApiMutation<NonceResponse, NonceRequest>(
    API_ENDPOINTS.CREATE_NONCE,
    { method: "POST", retries: 0 },
  );
}

/**
 * Hook to connect wallet and verify signature
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useConnectWallet() {
  return useApiMutation<ConnectWalletResponse, ConnectWalletRequest>(
    API_ENDPOINTS.CONNECT_WALLET,
    { method: "POST" },
  );
}

/**
 * Hook to connect a social account (Lens or Twitter)
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useConnectSocial() {
  return useApiMutation<ConnectSocialResponse, ConnectSocialRequest>(
    API_ENDPOINTS.CONNECT_SOCIAL,
    { method: "POST" },
  );
}
