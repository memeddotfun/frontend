"use client";

import { useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useSignMessage } from "wagmi";
import { useCreateNonce, useConnectWallet } from "../../hooks/api/useAuth";
import { useAuthStore } from "@/store/auth";

export function ClientConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

  // State to hold the nonce for the signing process
  const [nonce, setNonce] = useState<string | null>(null);

  // API Hooks
  const {
    mutate: createNonce,
    data: nonceData,
    error: nonceError,
  } = useCreateNonce();
  const {
    mutate: connectWallet,
    data: authData,
    error: authError,
  } = useConnectWallet();

  // Wagmi hook to sign a message
  const { signMessage } = useSignMessage({
    mutation: {
      onSuccess(signature) {
        if (address && nonce) {
          console.log("Message signed successfully. Connecting wallet...");
          connectWallet({ address, signature, message: nonce });
        }
      },
      onError(error) {
        console.error("Failed to sign message:", error);
      },
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Trigger sign-in flow if wallet is connected but user is not authenticated
  useEffect(() => {
    // Only run if wallet is connected, initial auth check is done, and user is not authenticated
    if (
      isConnected &&
      address &&
      !isAuthLoading &&
      !isAuthenticated &&
      !nonce
    ) {
      console.log(
        `Wallet connected, but no session found. Starting sign-in flow for ${address}...`,
      );
      createNonce({ address });
    }
  }, [
    isConnected,
    address,
    isAuthLoading,
    isAuthenticated,
    createNonce,
    nonce,
  ]);

  // 2. Store nonce and sign message when nonce is received
  useEffect(() => {
    if (nonceData?.nonce) {
      const actualNonce = nonceData.nonce;
      console.log("Nonce received:", actualNonce);
      setNonce(actualNonce);
      console.log("Signing message with nonce...");
      signMessage({ message: actualNonce });
    }
  }, [nonceData, signMessage]);

  // 3. Handle successful authentication by re-verifying the session
  useEffect(() => {
    if (authData?.message) {
      console.log(
        "Authentication successful. Re-verifying session to fetch user data.",
      );
      // After the /connect-wallet call succeeds, we trigger a session verification
      // which will fetch the user data from /user and update the global state.
      useAuthStore.getState().verifySession();
    }
  }, [authData]);

  // Error handling
  useEffect(() => {
    if (nonceError) {
      console.error("Failed to create nonce:", nonceError);
    }
    if (authError) {
      console.error("Failed to connect wallet:", authError);
    }
  }, [nonceError, authError]);

  if (!mounted) {
    return <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse" />;
  }

  return <ConnectKitButton />;
}
