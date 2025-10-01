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

export interface User {
  id: string;
  address: string;
  lensHandle?: string;
  createdAt: string;
  // Add other user properties as needed
}

export interface ConnectWalletResponse {
  user: User;
  token: string; // JWT or session token
}

/**
 * Hook to create a nonce for authentication
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export function useCreateNonce() {
  return useApiMutation<NonceResponse, NonceRequest>(
    API_ENDPOINTS.CREATE_NONCE,
    { method: "POST" },
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
